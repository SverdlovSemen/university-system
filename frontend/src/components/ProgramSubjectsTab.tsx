import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import {
    getSpecializationSubjects,
    getProgramSubjectsForAdmissionCondition,
    updateProgramSubjectsForAdmissionCondition,
    ProgramSubjectResponse,
    ProgramSubjectRequest
} from '../api/programSubjectApi';

interface ProgramSubjectsTabProps {
    programId: number;
    admissionConditionId: number;
    year: number;
}

interface SubjectFormData {
    subjectId: number;
    subjectName: string;
    isRequired: boolean;
    isSelected: boolean;
    minScoreForYear: number;
    examNumber: number;
    minScore: number;
}

const ProgramSubjectsTab: React.FC<ProgramSubjectsTabProps> = ({
    programId,
    admissionConditionId,
    year
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [subjects, setSubjects] = useState<SubjectFormData[]>([]);

    // Загружаем данные при монтировании
    useEffect(() => {
        loadSubjects();
    }, [programId, admissionConditionId, year]);

    const loadSubjects = async () => {
        try {
            setLoading(true);
            setError(null);

            // Получаем все предметы специализации
            const specializationSubjects = await getSpecializationSubjects(programId, year);

            // Получаем уже выбранные предметы для условия поступления
            const programSubjects = await getProgramSubjectsForAdmissionCondition(
                programId,
                admissionConditionId
            );

            // Создаем карту для быстрого поиска
            const programSubjectsMap = new Map<number, ProgramSubjectResponse>();
            programSubjects.forEach(ps => {
                programSubjectsMap.set(ps.subjectId, ps);
            });

            // Формируем данные для формы
            const formData: SubjectFormData[] = specializationSubjects.map(ss => {
                const programSubject = programSubjectsMap.get(ss.subjectId);
                const isSelected = !!programSubject || ss.isRequired;

                return {
                    subjectId: ss.subjectId,
                    subjectName: ss.subjectName,
                    isRequired: ss.isRequired,
                    isSelected: isSelected,
                    minScoreForYear: ss.minScoreForYear,
                    examNumber: programSubject?.examNumber || 1,
                    minScore: programSubject?.minScore || ss.minScoreForYear
                };
            });

            setSubjects(formData);
        } catch (err) {
            console.error('Ошибка загрузки предметов:', err);
            setError('Не удалось загрузить список предметов');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (subjectId: number, checked: boolean) => {
        setSubjects(prev => prev.map(s =>
            s.subjectId === subjectId ? { ...s, isSelected: checked } : s
        ));
        setSaveError(null);
        setSuccessMessage(null);
    };

    const handleExamNumberChange = (subjectId: number, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 1 && numValue <= 5) {
            setSubjects(prev => prev.map(s =>
                s.subjectId === subjectId ? { ...s, examNumber: numValue } : s
            ));
        }
        setSaveError(null);
        setSuccessMessage(null);
    };

    const handleMinScoreChange = (subjectId: number, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
            setSubjects(prev => prev.map(s =>
                s.subjectId === subjectId ? { ...s, minScore: numValue } : s
            ));
        }
        setSaveError(null);
        setSuccessMessage(null);
    };

    const validateForm = (): string | null => {
        const selectedSubjects = subjects.filter(s => s.isSelected);

        if (selectedSubjects.length === 0) {
            return 'Необходимо выбрать хотя бы один предмет';
        }

        // Проверяем, что все обязательные предметы выбраны
        const requiredNotSelected = subjects.filter(s => s.isRequired && !s.isSelected);
        if (requiredNotSelected.length > 0) {
            return 'Все обязательные предметы должны быть выбраны';
        }

        // Проверяем минимальные баллы
        for (const subject of selectedSubjects) {
            if (subject.minScore < subject.minScoreForYear) {
                return `Минимальный балл для предмета "${subject.subjectName}" не может быть ниже ${subject.minScoreForYear}`;
            }
        }

        return null;
    };

    const handleSave = async () => {
        const validationError = validateForm();
        if (validationError) {
            setSaveError(validationError);
            return;
        }

        try {
            setSaving(true);
            setSaveError(null);
            setSuccessMessage(null);

            const selectedSubjects = subjects.filter(s => s.isSelected);

            const requestData: ProgramSubjectRequest[] = selectedSubjects.map(s => ({
                subjectId: s.subjectId,
                examNumber: s.examNumber,
                minScore: s.minScore
            }));

            await updateProgramSubjectsForAdmissionCondition(
                programId,
                admissionConditionId,
                { subjects: requestData }
            );

            setSuccessMessage('Предметы успешно сохранены');

            // Перезагружаем данные
            await loadSubjects();
        } catch (err: any) {
            console.error('Ошибка сохранения предметов:', err);

            let errorMessage = 'Не удалось сохранить предметы';

            if (err.response?.status === 403) {
                errorMessage = 'Доступ запрещен. У вас недостаточно прав для выполнения этой операции.';
            } else if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            } else if (err.message) {
                errorMessage = err.message;
            }

            setSaveError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger">{error}</Alert>
        );
    }

    if (subjects.length === 0) {
        return (
            <Alert variant="info">
                Для этой специальности пока не добавлено ни одного предмета.
                Обратитесь к администратору системы для добавления предметов.
            </Alert>
        );
    }

    return (
        <Card>
            <Card.Body>
                <div className="mb-3">
                    <Alert variant="info">
                        <strong>Инструкция:</strong>
                        <ul className="mb-0 mt-2">
                            <li>Обязательные предметы отмечены и не могут быть убраны</li>
                            <li>Минимальный балл не может быть ниже установленного для {year} года</li>
                            <li>Минимальный балл не может быть выше 100</li>
                            <li>Приоритет (номер экзамена) - число от 1 до 5</li>
                        </ul>
                    </Alert>
                </div>

                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>Выбор</th>
                            <th>Предмет</th>
                            <th style={{ width: '100px' }}>Статус</th>
                            <th style={{ width: '150px' }}>Мин. балл ({year})</th>
                            <th style={{ width: '150px' }}>Приоритет (1-5)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map(subject => (
                            <tr key={subject.subjectId}>
                                <td className="text-center">
                                    <Form.Check
                                        type="checkbox"
                                        checked={subject.isSelected}
                                        disabled={subject.isRequired}
                                        onChange={(e) => handleCheckboxChange(subject.subjectId, e.target.checked)}
                                    />
                                </td>
                                <td>
                                    <strong>{subject.subjectName}</strong>
                                </td>
                                <td>
                                    {subject.isRequired ? (
                                        <span className="badge bg-danger">Обязательный</span>
                                    ) : (
                                        <span className="badge bg-secondary">Необязательный</span>
                                    )}
                                </td>
                                <td>
                                    <Form.Control
                                        type="number"
                                        value={subject.minScore}
                                        onChange={(e) => handleMinScoreChange(subject.subjectId, e.target.value)}
                                        disabled={!subject.isSelected}
                                        min={subject.minScoreForYear}
                                        max={100}
                                    />
                                    <Form.Text className="text-muted">
                                        Мин: {subject.minScoreForYear}
                                    </Form.Text>
                                </td>
                                <td>
                                    <Form.Control
                                        type="number"
                                        value={subject.examNumber}
                                        onChange={(e) => handleExamNumberChange(subject.subjectId, e.target.value)}
                                        disabled={!subject.isSelected}
                                        min={1}
                                        max={5}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                {saveError && (
                    <Alert variant="danger" className="mt-3">
                        {saveError}
                    </Alert>
                )}

                {successMessage && (
                    <Alert variant="success" className="mt-3">
                        {successMessage}
                    </Alert>
                )}

                <div className="d-flex gap-2 mt-3">
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Сохранение...
                            </>
                        ) : (
                            'Сохранить предметы'
                        )}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ProgramSubjectsTab;

