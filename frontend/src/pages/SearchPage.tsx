import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { fetchAllRegions } from '../api/regionApi';
import { fetchUniversities, searchUniversities } from '../api/universityApi';
import { searchSpecialties } from '../api/specialtyApi';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash/debounce';
import {
    UniversityResponse,
    RegionResponse,
    SpecialtyResponse,
    SelectOption
} from '../types';
import UniversityCard from '../components/UniversityCard';

const SearchPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [regions, setRegions] = useState<RegionResponse[]>([]);
    const [searchResults, setSearchResults] = useState<UniversityResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [nameQuery, setNameQuery] = useState<string>('');

    // Состояния для фильтров
    const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
    const [minScore, setMinScore] = useState<number | null>(null);
    const [maxScore, setMaxScore] = useState<number | null>(null);
    const [specialtyQuery, setSpecialtyQuery] = useState<string>('');
    const [specialtyResults, setSpecialtyResults] = useState<SpecialtyResponse[]>([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState<SelectOption | null>(null);
    const [isSpecialtySearching, setIsSpecialtySearching] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const regionsData = await fetchAllRegions();
                setRegions(regionsData);
            } catch (error) {
                console.error('Ошибка загрузки данных', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    const specialtySearch = useMemo(
        () => debounce(async (value: string) => {
            console.log('🔍 Фронтенд: Ищем специальности по запросу:', value);
            try {
                const specialties = await searchSpecialties(value);
                console.log('✅ Фронтенд: Получено специальностей:', specialties.length);
                if (specialties.length > 0) {
                    console.log('📋 Первые результаты:', specialties.slice(0, 3).map(s => `[${s.programCode}] ${s.name}`));
                }
                setSpecialtyResults(specialties);
            } catch (error) {
                console.error('❌ Ошибка поиска специальностей', error);
                setSpecialtyResults([]);
            } finally {
                setIsSpecialtySearching(false);
            }
        }, 300),
        []
    );

    useEffect(() => () => specialtySearch.cancel(), [specialtySearch]);

    const handleSpecialtyInputChange = (value: string) => {
        setSpecialtyQuery(value);
        if (selectedSpecialty && value !== selectedSpecialty.label) {
            setSelectedSpecialty(null);
        }

        const trimmed = value.trim();
        if (trimmed.length < 2) {
            specialtySearch.cancel();
            setSpecialtyResults([]);
            setIsSpecialtySearching(false);
            return;
        }

        setIsSpecialtySearching(true);
        specialtySearch(trimmed);
    };

    const handleSpecialtySelect = (specialty: SpecialtyResponse) => {
        const label = `${specialty.programCode ?? ''} - ${specialty.name}`.trim();
        setSelectedSpecialty({ value: specialty.id, label });
        setSpecialtyQuery(label);
        setSpecialtyResults([]);
        setIsSpecialtySearching(false);
    };

    // Функция для загрузки опций университетов с debounce
    const loadUniversityOptions = useCallback(
        debounce((inputValue: string, callback: (options: SelectOption[]) => void) => {
            searchUniversities(inputValue, 10).then(universities => {
                callback(
                    universities.map(u => ({
                        value: u.id,
                        label: `${(u as any).abbreviation || u.fullName} - ${u.fullName}`
                    }))
                );
            });
        }, 300),
        []
    );

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const regionParam = selectedRegion !== null ? selectedRegion : undefined;
            const minScoreParam = minScore !== null ? minScore : undefined;
            const maxScoreParam = maxScore !== null ? maxScore : undefined;
            const specialtyIds = selectedSpecialty ? [selectedSpecialty.value] : undefined;

            const results = await fetchUniversities(
                nameQuery.trim() || undefined,
                regionParam,
                undefined,
                specialtyIds,
                minScoreParam,
                maxScoreParam
            );

            setSearchResults(results);
        } catch (error) {
            console.error('Ошибка поиска', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Обработчик выбора университета из списка
    const handleUniversitySelect = (selectedOption: SelectOption | null) => {
        if (selectedOption) {
            navigate(`/university/${selectedOption.value}`);
        }
    };

    return (
        <Container className="mt-4">
            <div className="mb-4 p-3 border rounded">
                <h6>Фильтры поиска</h6>

                {/* Строка с поиском по названию университета */}
                <Row className="mb-3">
                    <Col md={12}>
                        <Form.Group>
                            <Form.Label>Поиск университета</Form.Label>
                            <AsyncSelect
                                cacheOptions
                                defaultOptions
                                loadOptions={loadUniversityOptions}
                                onChange={handleUniversitySelect}
                                placeholder="Введите название или аббревиатуру (МГУ, СПбГУ...)"
                                noOptionsMessage={({ inputValue }) =>
                                    inputValue ? "Ничего не найдено" : "Введите для поиска"
                                }
                                loadingMessage={() => "Загрузка..."}
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: '38px',
                                    }),
                                }}
                            />
                            <Form.Text className="text-muted">
                                Выберите университет из списка, чтобы перейти на его страницу
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                {/* Остальные фильтры */}
                <Row>
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Регион</Form.Label>
                            <Form.Select
                                value={selectedRegion || ''}
                                onChange={(e) => setSelectedRegion(e.target.value ? Number(e.target.value) : null)}
                            >
                                <option value="">Любой регион</option>
                                {regions.map(region => (
                                    <option key={region.id} value={region.id}>{region.name}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group className="mb-3 position-relative">
                            <Form.Label>Специальности</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Поиск по коду или названию..."
                                value={specialtyQuery}
                                onChange={(e) => handleSpecialtyInputChange(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                Начните ввод (минимум 2 символа) и выберите одну специальность из списка
                            </Form.Text>
                            {(specialtyResults.length > 0 || (isSpecialtySearching && specialtyQuery.trim().length >= 2)) && (
                                <div
                                    className="border rounded bg-white mt-1 shadow-sm"
                                    style={{ maxHeight: '220px', overflowY: 'auto', zIndex: 2, position: 'absolute', width: '100%' }}
                                >
                                    {isSpecialtySearching ? (
                                        <div className="text-center py-2">
                                            <Spinner animation="border" size="sm" /> Поиск специальностей...
                                        </div>
                                    ) : (
                                        specialtyResults.map((spec) => (
                                            <Button
                                                key={spec.id}
                                                variant="light"
                                                className="w-100 text-start border-bottom rounded-0"
                                                onClick={() => handleSpecialtySelect(spec)}
                                            >
                                                <strong>{spec.programCode || 'Без кода'}</strong> - {spec.name}
                                            </Button>
                                        ))
                                    )}
                                </div>
                            )}
                            {!isSpecialtySearching && !selectedSpecialty && specialtyQuery.trim().length >= 2 && specialtyResults.length === 0 && (
                                <div className="text-muted small mt-1">Ничего не найдено</div>
                            )}
                        </Form.Group>
                    </Col>

                    <Col md={2}>
                        <Form.Group className="mb-3">
                            <Form.Label>Мин. балл</Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                max="100"
                                value={minScore || ''}
                                onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : null)}
                            />
                            <Form.Text className="text-muted">
                                От 0 до 100
                            </Form.Text>
                        </Form.Group>
                    </Col>

                    <Col md={2}>
                        <Form.Group className="mb-3">
                            <Form.Label>Макс. балл</Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                max="100"
                                value={maxScore || ''}
                                onChange={(e) => setMaxScore(e.target.value ? Number(e.target.value) : null)}
                            />
                            <Form.Text className="text-muted">
                                От 0 до 100
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Button
                    variant="primary"
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="mt-2"
                >
                    {isLoading ? (
                        <>
                            <Spinner size="sm" animation="border" /> Поиск...
                        </>
                    ) : 'Поиск университетов'}
                </Button>
            </div>

            <Card>
                <Card.Header as="h5">Результаты поиска</Card.Header>
                <Card.Body>
                    {isLoading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                            <p className="mt-2">Идет поиск университетов...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <Row>
                            {searchResults.map(university => (
                                <Col key={university.id} md={6} className="mb-3">
                                    <UniversityCard university={university} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <p className="text-center text-muted">
                            Ничего не найдено. Измените параметры поиска.
                        </p>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SearchPage;

