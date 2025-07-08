import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';

const EditorDashboard = () => {
    const { user } = useAuth();

    return (
        <Container className="mt-4">
            <Card>
                <Card.Header as="h5">Панель редактора</Card.Header>
                <Card.Body>
                    <Card.Title>Добро пожаловать, {user?.username}!</Card.Title>
                    <Card.Text>
                        Здесь вы можете управлять информацией о вашем университете.
                    </Card.Text>

                    <div className="mt-4">
                        <Button variant="primary" className="me-2">Редактировать информацию</Button>
                        <Button variant="secondary">Добавить факультет</Button>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default EditorDashboard;