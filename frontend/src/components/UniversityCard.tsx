import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { UniversityResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface UniversityCardProps {
    university: UniversityResponse;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ university }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleDetailsClick = () => {
        navigate(`/university/${university.id}`);
    };

    return (
        <Card className="h-100">
            <Card.Body>
                {/* Основное название (сокращенное) */}
                <Card.Title>{university.shortName}</Card.Title>

                {/* Полное название (серым цветом, меньшим шрифтом) */}
                <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                    {university.fullName}
                </Card.Subtitle>

                {/* Город и регион */}
                <Card.Text className="mb-1">
                    <strong>Город:</strong> {university.city.name}
                </Card.Text>
                <Card.Text className="mb-2">
                    <strong>Регион:</strong> {university.city.region.name}
                </Card.Text>

                {/* Дополнительная информация */}
                <Card.Text>
                    <strong>Тип:</strong> {university.type}
                    <br />
                    <strong>Средний балл:</strong> {university.avgEgeScore || 'не указан'}
                    <br />
                    <strong>Рейтинг в стране:</strong> {university.countryRanking || 'не указан'}
                </Card.Text>

                <div className="d-flex justify-content-between">
                    <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleDetailsClick}
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