import React from 'react';
import { Card, Button, Row, Col, Badge } from 'react-bootstrap';
import { UniversityApplicationWithUserResponse } from '../api/universityApplicationApi';

interface ApplicationCardProps {
    application: UniversityApplicationWithUserResponse;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onApprove, onReject }) => {
    return (
        <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="bi bi-building me-2"></i>
                        {application.fullName}
                    </h5>
                    <Badge bg="warning" text="dark">
                        {application.statusName}
                    </Badge>
                </div>
            </Card.Header>
            <Card.Body>
                <Row>
                    <Col md={6}>
                        <h6 className="text-muted mb-3">
                            <i className="bi bi-person-circle me-2"></i>
                            Информация о пользователе
                        </h6>
                        <p className="mb-2">
                            <strong>Почта пользователя:</strong>{' '}
                            <a href={`mailto:${application.userEmail}`}>{application.userEmail}</a>
                        </p>
                        <hr />
                        <h6 className="text-muted mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            Информация об университете
                        </h6>
                        <p className="mb-2">
                            <strong>Полное название:</strong> {application.fullName}
                        </p>
                        {application.abbreviation && (
                            <p className="mb-2">
                                <strong>Аббревиатура:</strong> {application.abbreviation}
                            </p>
                        )}
                        {application.website && (
                            <p className="mb-2">
                                <strong>Сайт:</strong>{' '}
                                <a href={application.website} target="_blank" rel="noopener noreferrer">
                                    {application.website}
                                </a>
                            </p>
                        )}
                    </Col>
                    <Col md={6}>
                        <h6 className="text-muted mb-3">
                            <i className="bi bi-person-badge me-2"></i>
                            Контактное лицо
                        </h6>
                        <p className="mb-2">
                            <strong>Имя:</strong> {application.contactPersonName}
                        </p>
                        {application.contactPersonPosition && (
                            <p className="mb-2">
                                <strong>Должность:</strong> {application.contactPersonPosition}
                            </p>
                        )}
                        <p className="mb-2">
                            <strong>Почта:</strong>{' '}
                            <a href={`mailto:${application.contactEmail}`}>{application.contactEmail}</a>
                        </p>
                        {application.contactPhone && (
                            <p className="mb-2">
                                <strong>Телефон:</strong>{' '}
                                <a href={`tel:${application.contactPhone}`}>{application.contactPhone}</a>
                            </p>
                        )}
                    </Col>
                </Row>
                <hr />
                <div className="d-flex justify-content-end gap-2">
                    <Button
                        variant="danger"
                        onClick={() => onReject(application.id)}
                    >
                        <i className="bi bi-x-circle me-2"></i>
                        Отклонить
                    </Button>
                    <Button
                        variant="success"
                        onClick={() => onApprove(application.id)}
                    >
                        <i className="bi bi-check-circle me-2"></i>
                        Одобрить
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ApplicationCard;

