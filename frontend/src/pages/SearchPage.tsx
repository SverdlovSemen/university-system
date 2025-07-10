import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAllRegions } from '../api/regionApi';
import { fetchUniversities } from '../api/universityApi';
import { searchSpecialties } from '../api/specialtyApi';
import AsyncSelect from 'react-select/async';
import {
    UniversityResponse,
    RegionResponse,
    SpecialtyResponse,
    SelectOption
} from '../types';
import UniversityCard from '../components/UniversityCard';

const SearchPage = () => {
    const { user, isAuthenticated, hasRole } = useAuth();
    const navigate = useNavigate();

    const [regions, setRegions] = useState<RegionResponse[]>([]);
    const [searchResults, setSearchResults] = useState<UniversityResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Состояния для фильтров
    const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
    const [minScore, setMinScore] = useState<number | null>(null);
    const [maxScore, setMaxScore] = useState<number | null>(null);
    const [selectedSpecialties, setSelectedSpecialties] = useState<SelectOption[]>([]);

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

    // Функция для загрузки опций специальностей
    const loadSpecialtyOptions = (inputValue: string): Promise<SelectOption[]> => {
        return searchSpecialties(inputValue).then(specialties =>
            specialties.map(s => ({
                value: s.id,
                label: `${s.programCode} - ${s.name}`
            }))
        );
    };

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const regionParam = selectedRegion !== null ? selectedRegion : undefined;
            const minScoreParam = minScore !== null ? minScore : undefined;
            const maxScoreParam = maxScore !== null ? maxScore : undefined;

            // Преобразуем выбранные опции в массив ID специальностей
            const specialtyIds = selectedSpecialties.map(option => option.value);

            console.log("Search parameters:", {
                regionId: regionParam,
                specialtyIds: specialtyIds,
                minScore: minScoreParam,
                maxScore: maxScoreParam
            });

            const results = await fetchUniversities(
                regionParam,
                undefined, // subjectIds пока не используется
                specialtyIds.length > 0 ? specialtyIds : undefined,
                minScoreParam,
                maxScoreParam
            );

            console.log("Search results:", results);
            setSearchResults(results);
        } catch (error) {
            console.error('Ошибка поиска', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <div className="mb-4 p-3 border rounded">
                <h6>Фильтры поиска</h6>
                <Row>
                    {/* Колонка для региона */}
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

                    {/* Колонка для специальностей */}
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label>Специальности</Form.Label>
                            <AsyncSelect
                                isMulti
                                cacheOptions
                                defaultOptions
                                loadOptions={loadSpecialtyOptions}
                                value={selectedSpecialties}
                                onChange={(selected) => setSelectedSpecialties(selected as SelectOption[])}
                                placeholder="Поиск по коду или названию..."
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
                        </Form.Group>
                    </Col>

                    {/* Колонка для минимального балла */}
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

                    {/* Колонка для максимального балла */}
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

            {/* Блок результатов */}
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