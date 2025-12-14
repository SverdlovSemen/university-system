import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Spinner, Button, Alert, Badge } from 'react-bootstrap';
import { getUniversitySpecialty } from '../api/universityApi';
import { getSpecialtyById } from '../api/specialtyApi';
import { SpecialtyResponse, SubjectResponse } from '../types';

const ProgramPage = () => {
    const { universityId, specialtyId } = useParams<{ universityId: string; specialtyId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const combinationId = searchParams.get('combinationId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [programData, setProgramData] = useState<any>(null);
    const [specialty, setSpecialty] = useState<SpecialtyResponse | null>(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!universityId || !specialtyId) throw new Error('Missing params');

                // Сначала пробуем получить информацию о специальности в контексте университета
                try {
                    const data = await getUniversitySpecialty(parseInt(universityId), parseInt(specialtyId));
                    if (mounted) {
                        // API returns an array of programs for this specialty in the university
                        if (Array.isArray(data)) {
                            let selected = null;
                            if (combinationId) {
                                // try to find program by combinationId stored as admission condition id or program id
                                selected = data.find((p: any) => String(p.id) === String(combinationId) || String(p.id) === String(specialtyId));
                            }
                            // if not found, pick first
                            if (!selected && data.length > 0) selected = data[0];
                            setProgramData(selected || null);
                        } else {
                            setProgramData(data);
                        }
                    }
                } catch (e) {
                    // Если сервер не поддерживает endpoint, подгрузим общую информацию о специальности
                    const s = await getSpecialtyById(parseInt(specialtyId));
                    if (mounted) setSpecialty(s);
                }
            } catch (err) {
                console.error(err);
                if (mounted) setError('Не удалось загрузить данные о программе');
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => { mounted = false; };
    }, [universityId, specialtyId]);

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
                <p>Загрузка информации о программе...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-4">
                <Alert variant="danger">{error}</Alert>
                <Button onClick={() => navigate(-1)}>Назад</Button>
            </Container>
        );
    }

    // Если backend вернул programData — показываем расширенную информацию
    if (programData) {
        return (
            <Container className="mt-4">
                <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">← Назад</Button>
                <Card>
                    <Card.Body>
                        <h4>{programData.facultyName ? `${programData.facultyName} — ${programData.universityShortName || ''}` : programData.universityShortName}</h4>
                        <div className="text-muted">{programData.programDescription}</div>

                        <hr />
                        <h5>Данные программы в {programData.universityShortName || ''}</h5>
                        <div>Форма обучения: {programData.studyForm ?? 'не указано'}</div>
                        <div>Длительность: {programData.duration ?? 'не указано'}</div>

                        {programData.admissionConditions && programData.admissionConditions.length > 0 && (
                            <div className="mt-3">
                                <h6>Условия приёма</h6>
                                {programData.admissionConditions.map((ac: any, idx: number) => (
                                    <div key={idx} className="mb-2">
                                        <div>Год: {ac.year}</div>
                                        <div>Проходной балл: {ac.passingScore ?? 'не указан'}</div>
                                        <div>Бюджетные места: {ac.budgetPlaces ?? 'не указано'}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {programData.subjects && programData.subjects.length > 0 && (
                            <div className="mt-3">
                                <strong>Требуемые предметы:</strong>
                                <div className="d-flex gap-2 flex-wrap mt-2">
                                    {programData.subjects.map((s: SubjectResponse) => (
                                        <Badge key={s.id} bg="info" className="py-2">{s.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        );
    }

    // В противном случае — показываем общую информацию о специальности как fallback
    return (
        <Container className="mt-4">
            <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">← Назад</Button>
            <Card>
                <Card.Body>
                    <h4>{specialty?.name}</h4>
                    <div className="text-muted">Код программы: {specialty?.programCode}</div>
                    <div className="mt-2">{specialty?.description}</div>

                    {specialty?.subjectCombinations && specialty.subjectCombinations.length > 0 && (
                        <div className="mt-3">
                            <strong>Требуемые предметы:</strong>
                            <div className="d-flex gap-2 flex-wrap mt-2">
                                {Array.from(new Set(specialty.subjectCombinations.flatMap(c => c.subjects.map(s => s.name)))).map((name, idx) => (
                                    <Badge key={idx} bg="info" className="py-2">{name}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <Alert variant="info" className="mt-3">Подробные данные о приёме для этой программы в конкретном университете отсутствуют на сервере.</Alert>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ProgramPage;
