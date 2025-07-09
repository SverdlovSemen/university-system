import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Container, Row, Col, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAllRegions } from '../api/regionApi';
import { fetchUniversities } from '../api/universityApi';
import {
    UniversityResponse,
    SubjectResponse,
    RegionResponse
} from '../types';
import UniversityCard from '../components/UniversityCard';

const SearchPage = () => {
    const { user, isAuthenticated, hasRole } = useAuth();
    const navigate = useNavigate();

    const [regions, setRegions] = useState<RegionResponse[]>([]);
    const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
    const [searchResults, setSearchResults] = useState<UniversityResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
    const [minScore, setMinScore] = useState<number | null>(null);
    const [maxScore, setMaxScore] = useState<number | null>(null);
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

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const regionParam = selectedRegion !== null ? selectedRegion : undefined;
            const minScoreParam = minScore !== null ? minScore : undefined;
            const maxScoreParam = maxScore !== null ? maxScore : undefined; // Добавляем

            console.log("Search parameters:", {
                regionId: regionParam,
                minScore: minScoreParam,
                maxScore: maxScoreParam  // Добавляем в логи
            });

            const results = await fetchUniversities(
                regionParam,
                undefined,
                minScoreParam,
                maxScoreParam  // Добавляем
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

            {/* Обновлённый блок фильтров */}
            <div className="mb-4 p-3 border rounded">
                <h6>Фильтры поиска</h6>
                <Row>
                    {/* Колонка для региона - теперь занимает 6 колонок */}
                    <Col md={6}>
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

                    {/* Колонка для минимального балла - теперь занимает 3 колонки */}
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Минимальный балл ЕГЭ</Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                max="100"
                                value={minScore || ''}
                                onChange={(e) => setMinScore(e.target.value ? Number(e.target.value) : null)}
                            />
                            <Form.Text className="text-muted">
                                Введите значение от 0 до 100
                            </Form.Text>
                        </Form.Group>
                    </Col>

                    {/* Колонка для максимального балла - теперь занимает 3 колонки */}
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label>Максимальный балл ЕГЭ</Form.Label>
                            <Form.Control
                                type="number"
                                min="0"
                                max="100"
                                value={maxScore || ''}
                                onChange={(e) => setMaxScore(e.target.value ? Number(e.target.value) : null)}
                            />
                            <Form.Text className="text-muted">
                                Введите значение от 0 до 100
                            </Form.Text>
                        </Form.Group>
                    </Col>
                </Row>

                <Button
                    variant="primary"
                    onClick={handleSearch}
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner size="sm" /> : 'Поиск'}
                </Button>
            </div>


            {/* Обновлённый блок результатов */}
            <Card>
                <Card.Header as="h5">Результаты поиска</Card.Header>
                <Card.Body>
                    {isLoading ? (
                        <div className="text-center">
                            <Spinner animation="border" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="row">
                            {searchResults.map(university => (
                                <div key={university.id} className="col-md-6 mb-3">
                                    <UniversityCard university={university} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Ничего не найдено. Измените параметры поиска.</p>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default SearchPage;