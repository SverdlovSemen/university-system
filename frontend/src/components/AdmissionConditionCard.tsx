import React from 'react';
import { Card, Badge, Row, Col, Button } from 'react-bootstrap';
import { AdmissionConditionResponse } from '../types';

interface AdmissionConditionCardProps {
    condition: AdmissionConditionResponse;
    onEdit?: (id: number) => void;
}

const AdmissionConditionCard: React.FC<AdmissionConditionCardProps> = ({ condition, onEdit }) => {
    return (
        <Card className="mb-3 shadow-sm">
            <Card.Header className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                        <i className="bi bi-calendar-check me-2"></i>
                        Условия поступления {condition.year} года
                    </h5>
                    {onEdit && (
                        <Button variant="light" size="sm" onClick={() => onEdit(condition.id)}>
                            <i className="bi bi-pencil me-2"></i>
                            Редактировать
                        </Button>
                    )}
                </div>
            </Card.Header>
            <Card.Body>
                <Row>
                    <Col md={6}>
                        <h6 className="text-muted mb-3">
                            <i className="bi bi-info-circle me-2"></i>
                            Основная информация
                        </h6>
                        {condition.admissionFee !== undefined && condition.admissionFee !== null && (
                            <p className="mb-2">
                                <strong>Стоимость поступления:</strong> {condition.admissionFee.toLocaleString()} ₽
                            </p>
                        )}
                        {condition.passingScore !== undefined && condition.passingScore !== null && (
                            <p className="mb-2">
                                <strong>Проходной балл:</strong> {condition.passingScore}
                            </p>
                        )}
                        {condition.hasDvi !== undefined && condition.hasDvi !== null && (
                            <p className="mb-2">
                                <strong>Наличие ДВИ:</strong>{' '}
                                <Badge bg={condition.hasDvi ? 'success' : 'secondary'}>
                                    {condition.hasDvi ? 'Да' : 'Нет'}
                                </Badge>
                            </p>
                        )}
                    </Col>
                    <Col md={6}>
                        <h6 className="text-muted mb-3">
                            <i className="bi bi-people me-2"></i>
                            Количество мест
                        </h6>
                        {condition.budgetPlaces !== undefined && condition.budgetPlaces !== null && (
                            <p className="mb-2">
                                <strong>Бюджетные места:</strong> {condition.budgetPlaces}
                            </p>
                        )}
                        {condition.targetedPlaces !== undefined && condition.targetedPlaces !== null && (
                            <p className="mb-2">
                                <strong>Целевые места:</strong> {condition.targetedPlaces}
                            </p>
                        )}
                        {condition.paidPlaces !== undefined && condition.paidPlaces !== null && (
                            <p className="mb-2">
                                <strong>Платные места:</strong> {condition.paidPlaces}
                            </p>
                        )}
                    </Col>
                </Row>
                {condition.subjects && condition.subjects.length > 0 && (
                    <>
                        <hr />
                        <h6 className="text-muted mb-3">
                            <i className="bi bi-book me-2"></i>
                            Предметы для поступления
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                            {condition.subjects.map((subject) => (
                                <Badge key={subject.id} bg="info" className="p-2">
                                    {subject.name}
                                    {subject.minScore && ` (мин. ${subject.minScore})`}
                                </Badge>
                            ))}
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default AdmissionConditionCard;

