import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { UniversityResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom'; // Добавляем useNavigate

interface UniversityCardProps {
    university: UniversityResponse;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ university }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate(); // Хук для навигации

    // Обработчик клика для перехода на страницу университета
    const handleDetailsClick = () => {
        navigate(`/university/${university.id}`);
    };

    return (
        <Card className="h-100">
            <Card.Body>
                <Card.Title>{university.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                    {university.city.name}, {university.city.region.name}
                </Card.Subtitle>
                <Card.Text>
                    Тип: {university.type}
                    <br />
                    Средний балл: {university.avgEgeScore || 'не указан'}
                    <br />
                    Рейтинг в стране: {university.countryRanking || 'не указан'}
                </Card.Text>

                <div className="d-flex justify-content-between">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleDetailsClick} // Используем новый обработчик
                    >
                        Подробнее
                    </Button>

                    {isAuthenticated && (
                        <Button variant="outline-secondary" size="sm">
                            ★ В избранное
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default UniversityCard;