import React from 'react';
import { AdmissionConditionResponse } from '../types';
import { Card, Table } from 'react-bootstrap';

interface Props {
    condition: AdmissionConditionResponse;
}

const AdmissionConditionCard: React.FC<Props> = ({ condition }) => {
    // Сортировка предметов по exam_number (если есть)
    const sortedSubjects = [...(condition.subjects || [])].sort((a: any, b: any) => {
        if (a.examNumber !== undefined && b.examNumber !== undefined) {
            return a.examNumber - b.examNumber;
        }
        return 0;
    });

    return (
        <Card className="mb-3">
            <Card.Body>
                <Card.Title>Год: {condition.year}</Card.Title>
                <div>Проходной балл: {condition.passingScore ?? '—'}</div>
                <div>Стоимость поступления: {condition.admissionFee !== undefined && condition.admissionFee !== null ? `${condition.admissionFee} ₽` : '—'}</div>
                <div>Наличие ДВИ: {condition.hasDvi === true ? 'Да' : condition.hasDvi === false ? 'Нет' : '—'}</div>
                <div>Бюджетные места: {condition.budgetPlaces ?? '—'}</div>
                <div>Целевые места: {condition.targetedPlaces ?? '—'}</div>
                <div>Платные места: {condition.paidPlaces ?? '—'}</div>
                <div style={{ marginTop: 12 }}>
                    <b>Предметы для поступления:</b>
                    <Table size="sm" bordered hover className="mt-2">
                        <thead>
                            <tr>
                                <th>№</th>
                                <th>Название</th>
                                <th>Приоритет</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSubjects.map((subj: any, idx) => (
                                <tr key={subj.id}>
                                    <td>{idx + 1}</td>
                                    <td>{subj.name}</td>
                                    <td>{subj.examNumber ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
};

export default AdmissionConditionCard;
