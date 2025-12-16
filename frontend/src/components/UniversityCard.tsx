import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner } from 'react-bootstrap';
import { UniversityResponse } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getUniversityPrograms } from '../api/universityApi';

interface UniversityCardProps {
    university: UniversityResponse;
    hideDetailsButton?: boolean;
    hideFavoriteButton?: boolean;
}

const UniversityCard: React.FC<UniversityCardProps> = ({ university, hideDetailsButton, hideFavoriteButton }) => {
    const {
        isAuthenticated,
        addFavoriteUniversity,
        removeFavoriteUniversity,
        user,
        refreshUserProfile
    } = useAuth();
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [avgScore, setAvgScore] = useState<string | number>('—');
    const [loadingScore, setLoadingScore] = useState(true);

    useEffect(() => {
        if (user && user.favoriteUniversities) {
            const isCurrentlyFavorite = user.favoriteUniversities.includes(university.id);
            console.log(`🏛️ Университет ${university.id}: избранное = ${isCurrentlyFavorite}`, {
                universityId: university.id,
                favoriteIds: user.favoriteUniversities
            });
            setIsFavorite(isCurrentlyFavorite);
        }
    }, [user, university.id]);

    useEffect(() => {
        let cancelled = false;
        async function fetchAvgScore() {
            setLoadingScore(true);
            try {
                const programs = await getUniversityPrograms(university.id);
                if (!programs || programs.length === 0) {
                    setAvgScore('за последние 5 лет ничего не найдено');
                    setLoadingScore(false);
                    return;
                }
                // Определяем последний учебный год по правилам
                const now = new Date();
                let lastYear = now.getFullYear();
                if (now.getMonth() < 8) lastYear -= 1; // Январь-август — предыдущий год
                let found = false;
                for (let offset = 0; offset < 5; offset++) {
                    const year = lastYear - offset;
                    // Собираем все проходные баллы за этот год
                    const scores: number[] = [];
                    programs.forEach((p: any) => {
                        if (Array.isArray(p.admissionConditions)) {
                            p.admissionConditions.forEach((cond: any) => {
                                if (cond.year === year && cond.passingScore != null) {
                                    scores.push(Number(cond.passingScore));
                                }
                            });
                        }
                    });
                    if (scores.length > 0) {
                        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
                        setAvgScore(avg.toFixed(1));
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    setAvgScore('за последние 5 лет ничего не найдено');
                }
            } catch (e) {
                setAvgScore('ошибка');
            }
            setLoadingScore(false);
        }
        fetchAvgScore();
        return () => { cancelled = true; };
    }, [university.id]);

    const handleDetailsClick = () => {
        navigate(`/university/${university.id}`);
    };

    const handleFavoriteClick = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            if (isFavorite) {
                await removeFavoriteUniversity(university.id);
            } else {
                await addFavoriteUniversity(university.id);
            }
            // Состояние обновится автоматически через useEffect при изменении user в AuthContext
        } catch (error) {
            console.error('Ошибка обновления избранного:', error);
        }
    };

    return (
        <Card className="h-100">
            <Card.Body>
                <Card.Title>{university.abbreviation || university.fullName}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                    {university.fullName}
                </Card.Subtitle>
                <Card.Text className="mb-1">
                    <strong>Город:</strong> {university.city?.name || '—'}
                </Card.Text>
                <Card.Text className="mb-2">
                    <strong>Регион:</strong> {university.city?.region?.name || '—'}
                </Card.Text>
                <Card.Text>
                    <strong>Тип:</strong> {university.type}
                    <br />
                    <strong>Форма собственности:</strong> {university.ownershipType || '—'}
                    <br />
                    <strong>Средний проходной балл:</strong> {loadingScore ? <Spinner size="sm" /> : avgScore}
                </Card.Text>
                <div className="d-flex justify-content-between">
                    {!hideDetailsButton && (
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleDetailsClick}
                        >
                            Подробнее
                        </Button>
                    )}
                    {isAuthenticated && !hideFavoriteButton && (
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