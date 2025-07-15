import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { UniversityResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface UniversityCardProps {
    university: UniversityResponse;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ university }) => {
    const {
        isAuthenticated,
        addFavoriteUniversity,
        removeFavoriteUniversity,
        user
    } = useAuth();
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (user && user.favoriteUniversities) {
            setIsFavorite(user.favoriteUniversities.includes(university.id));
        }
    }, [user, university.id]);

    const handleDetailsClick = () => {
        navigate(`/university/${university.id}`);
    };

    const handleFavoriteClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (isFavorite) {
            removeFavoriteUniversity(university.id);
        } else {
            addFavoriteUniversity(university.id);
        }
        setIsFavorite(!isFavorite);
    };

    return (
        <Card className="h-100">
            <Card.Body>
                <Card.Title>{university.shortName}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                    {university.fullName}
                </Card.Subtitle>
                <Card.Text className="mb-1">
                    <strong>Город:</strong> {university.city.name}
                </Card.Text>
                <Card.Text className="mb-2">
                    <strong>Регион:</strong> {university.city.region.name}
                </Card.Text>
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
                        <Button
                            variant={isFavorite ? "warning" : "outline-secondary"}
                            size="sm"
                            onClick={handleFavoriteClick}
                        >
                            {isFavorite ? '★ В избранном' : '☆ В избранное'}
                        </Button>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
};

export default UniversityCard;