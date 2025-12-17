import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getPendingApplications, rejectApplication, approveApplication, UniversityApplicationWithUserResponse } from '../api/universityApplicationApi';
import ApplicationCard from '../components/ApplicationCard';

const AdminApplicationPage = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<UniversityApplicationWithUserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingApplications();
    }, []);

    const fetchPendingApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getPendingApplications();
            setApplications(data);
        } catch (err: any) {
            console.error('Ошибка загрузки заявок:', err);
            setError('Не удалось загрузить заявки. Попробуйте обновить страницу.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            setError(null);
            await approveApplication(id);

            // Удаляем заявку из локального состояния (она больше не "необработанная")
            setApplications(prevApplications =>
                prevApplications.filter(app => app.id !== id)
            );

            console.log('Заявка успешно одобрена:', id);
        } catch (err: any) {
            console.error('Ошибка при одобрении заявки:', err);
            setError('Не удалось одобрить заявку. Попробуйте снова.');
        }
    };

    const handleReject = async (id: number) => {
        try {
            setError(null);
            await rejectApplication(id);

            // Удаляем заявку из локального состояния
            setApplications(prevApplications =>
                prevApplications.filter(app => app.id !== id)
            );

            console.log('Заявка успешно отклонена и удалена:', id);
        } catch (err: any) {
            console.error('Ошибка при отклонении заявки:', err);
            setError('Не удалось отклонить заявку. Попробуйте снова.');
        }
    };

    return (
        <Container className="mt-4">
            <Card className="mb-4">
                <Card.Header as="h4">
                    <i className="bi bi-building me-2"></i>
                    Заявки университетов
                </Card.Header>
                <Card.Body>
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/admin-page')}
                        className="mb-3"
                    >
                        <i className="bi bi-arrow-left me-2"></i>
                        Назад
                    </Button>

                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    {loading ? (
                        <div className="text-center my-5">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </Spinner>
                            <p className="mt-2">Загрузка заявок...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            Нет необработанных заявок
                        </Alert>
                    ) : (
                        <div>
                            <h5 className="mb-3">
                                Всего необработанных заявок: <strong>{applications.length}</strong>
                            </h5>
                            {applications.map((application) => (
                                <ApplicationCard
                                    key={application.id}
                                    application={application}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            ))}
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default AdminApplicationPage;

