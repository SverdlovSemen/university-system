import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Spinner, Tabs, Tab } from 'react-bootstrap';
import { fetchProgramDetailsByUniversity } from '../api/programApi';
import { ProgramResponse, UniversityResponse } from '../types';
import { getUniversityById } from '../api/universityApi';
import AdmissionConditionCard from '../components/AdmissionConditionCard';

const ProgramPage = () => {
    const { universityId, programId } = useParams<{ universityId: string; programId: string }>();
    const [loading, setLoading] = useState(true);
    const [program, setProgram] = useState<ProgramResponse | null>(null);
    const [university, setUniversity] = useState<UniversityResponse | null>(null);
    const [activeTab, setActiveTab] = useState<string>('info');

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            try {
                if (!universityId || !programId) throw new Error('Missing ids');
                const [uni, list] = await Promise.all([
                    getUniversityById(Number(universityId)),
                    fetchProgramDetailsByUniversity(Number(universityId))
                ]);
                const found = list.find(p => p.id === Number(programId)) || null;
                if (mounted) {
                    setUniversity(uni);
                    setProgram(found);
                }
            } catch {
                if (mounted) {
                    setUniversity(null);
                    setProgram(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [universityId, programId]);

    if (loading) {
        return (
            <Container className="mt-4 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (!program) {
        return (
            <Container className="mt-4 text-center">
                <div>Программа не найдена</div>
            </Container>
        );
    }

    const facultyName = program.faculty?.fullName || program.faculty?.abbreviation || '—';

    return (
        <Container className="mt-4">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 22 }}>{university?.fullName || 'Университет не найден'}</div>
                <div style={{ fontSize: 20, color: '#555' }}> {facultyName}</div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 24, fontWeight: 500 }}>{program.specialty?.name || '-'}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{program.specialty?.programCode || '-'}</div>
                <div style={{ fontSize: 20, fontWeight: 400, color: '#777' }}>{program.specialty?.educationLevel || 'Уровень образования не указан'}</div>
            </div>
            <Tabs activeKey={activeTab} onSelect={k => setActiveTab(k || 'info')} className="mb-4" justify>
                <Tab eventKey="info" title="Инфо">
                    <div style={{ padding: 16 }}>
                        <div>Форма обучения: {program.studyForm ?? 'не указано'}</div>
                        <div>Длительность: {program.duration ?? 'не указано'}</div>
                        <div>Возможность мобильности: {program.mobilityOption ? 'Да' : 'Нет'}</div>
                        <div>Язык обучения: {program.teachingLanguage || 'не указан'}</div>
                        <div style={{ marginTop: 16, color: '#555' }}>{program.programDescription || 'Описание отсутствует'}</div>
                    </div>
                </Tab>
                <Tab eventKey="admission" title="Условия поступления">
                    <div style={{ padding: 16 }}>
                        {program.admissionConditions && program.admissionConditions.length > 0 ? (
                            program.admissionConditions
                                .slice()
                                .sort((a, b) => b.year - a.year)
                                .map(cond => (
                                    <AdmissionConditionCard key={cond.year} condition={cond} />
                                ))
                        ) : (
                            <div>Нет данных об условиях поступления</div>
                        )}
                    </div>
                </Tab>
                <Tab eventKey="disciplines" title="Дисциплины">
                    <div style={{ padding: 16 }}>
                        {/* Здесь будет информация по дисциплинам */}
                        <div>В разработке</div>
                    </div>
                </Tab>
            </Tabs>
        </Container>
    );
};

export default ProgramPage;
