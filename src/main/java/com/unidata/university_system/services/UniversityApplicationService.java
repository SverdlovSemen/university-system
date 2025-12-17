package com.unidata.university_system.services;

import com.unidata.university_system.dto.UniversityApplicationRequest;
import com.unidata.university_system.dto.UniversityApplicationResponse;
import com.unidata.university_system.dto.UniversityApplicationWithUserResponse;
import com.unidata.university_system.models.ApplicationStatus;
import com.unidata.university_system.models.UniversityApplication;
import com.unidata.university_system.models.User;
import com.unidata.university_system.repositories.ApplicationStatusRepository;
import com.unidata.university_system.repositories.UniversityApplicationRepository;
import com.unidata.university_system.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UniversityApplicationService {

    @Autowired
    private UniversityApplicationRepository applicationRepository;

    @Autowired
    private ApplicationStatusRepository statusRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public UniversityApplicationResponse createApplication(UniversityApplicationRequest request) {
        log.info("Creating university application for: {}", request.getFullName());

        // Получаем текущего пользователя
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Находим статус "не обработано"
        ApplicationStatus status = statusRepository.findByName("не обработано")
                .orElseThrow(() -> new RuntimeException("Статус 'не обработано' не найден"));

        // Создаем заявку
        UniversityApplication application = new UniversityApplication();
        application.setUser(user);
        application.setFullName(request.getFullName());
        application.setAbbreviation(request.getAbbreviation());
        application.setWebsite(request.getWebsite());
        application.setContactPersonName(request.getContactPersonName());
        application.setContactPersonPosition(request.getContactPersonPosition());
        application.setContactEmail(request.getContactEmail());
        application.setContactPhone(request.getContactPhone());
        application.setStatus(status);
        application.setProcessedBy(null);
        application.setProcessedAt(null);

        UniversityApplication savedApplication = applicationRepository.save(application);
        log.info("University application created successfully with ID: {}", savedApplication.getId());

        return mapToResponse(savedApplication);
    }

    public List<UniversityApplicationResponse> getUserApplications() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        List<UniversityApplication> applications = applicationRepository.findByUserId(user.getId());
        return applications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public boolean hasActiveApplication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        List<UniversityApplication> applications = applicationRepository.findByUserId(user.getId());

        // Проверяем, есть ли у пользователя какие-либо заявки
        return !applications.isEmpty();
    }

    public List<UniversityApplicationWithUserResponse> getPendingApplications() {
        log.info("Getting all pending university applications");

        ApplicationStatus pendingStatus = statusRepository.findByName("не обработано")
                .orElseThrow(() -> new RuntimeException("Статус 'не обработано' не найден"));

        List<UniversityApplication> applications = applicationRepository.findByStatusId(pendingStatus.getId());

        return applications.stream()
                .map(this::mapToResponseWithUser)
                .collect(Collectors.toList());
    }

    private UniversityApplicationResponse mapToResponse(UniversityApplication application) {
        UniversityApplicationResponse response = new UniversityApplicationResponse();
        response.setId(application.getId());
        response.setUserId(application.getUser().getId());
        response.setFullName(application.getFullName());
        response.setAbbreviation(application.getAbbreviation());
        response.setWebsite(application.getWebsite());
        response.setContactPersonName(application.getContactPersonName());
        response.setContactPersonPosition(application.getContactPersonPosition());
        response.setContactEmail(application.getContactEmail());
        response.setContactPhone(application.getContactPhone());
        response.setStatusName(application.getStatus().getName());
        response.setProcessedBy(application.getProcessedBy() != null ? application.getProcessedBy().getId() : null);
        response.setProcessedAt(application.getProcessedAt());
        return response;
    }

    private UniversityApplicationWithUserResponse mapToResponseWithUser(UniversityApplication application) {
        UniversityApplicationWithUserResponse response = new UniversityApplicationWithUserResponse();
        response.setId(application.getId());
        response.setUserId(application.getUser().getId());
        response.setUserEmail(application.getUser().getEmail());
        response.setFullName(application.getFullName());
        response.setAbbreviation(application.getAbbreviation());
        response.setWebsite(application.getWebsite());
        response.setContactPersonName(application.getContactPersonName());
        response.setContactPersonPosition(application.getContactPersonPosition());
        response.setContactEmail(application.getContactEmail());
        response.setContactPhone(application.getContactPhone());
        response.setStatusName(application.getStatus().getName());
        response.setProcessedBy(application.getProcessedBy() != null ? application.getProcessedBy().getId() : null);
        response.setProcessedAt(application.getProcessedAt());
        return response;
    }

    @Transactional
    public void rejectApplication(Long applicationId) {
        log.info("Rejecting and deleting application with ID: {}", applicationId);

        UniversityApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        applicationRepository.delete(application);
        log.info("Application with ID: {} has been deleted", applicationId);
    }

    @Transactional
    public UniversityApplicationResponse approveApplication(Long applicationId) {
        log.info("Approving application with ID: {}", applicationId);

        UniversityApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        // Получаем текущего админа
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User admin = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Администратор не найден"));

        // Находим статус "обработано"
        ApplicationStatus processedStatus = statusRepository.findByName("обработано")
                .orElseThrow(() -> new RuntimeException("Статус 'обработано' не найден"));

        // Обновляем заявку
        application.setStatus(processedStatus);
        application.setProcessedBy(admin);
        application.setProcessedAt(java.time.LocalDateTime.now());

        UniversityApplication savedApplication = applicationRepository.save(application);
        log.info("Application with ID: {} has been approved", applicationId);

        return mapToResponse(savedApplication);
    }

    @Transactional
    public void declineOwnApplication(Long applicationId) {
        log.info("User declining their own application with ID: {}", applicationId);

        // Получаем текущего пользователя
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        UniversityApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        // Проверяем, что пользователь отклоняет свою собственную заявку
        if (!application.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Вы можете отклонить только свою собственную заявку");
        }

        applicationRepository.delete(application);
        log.info("User application with ID: {} has been declined and deleted by user", applicationId);
    }
}

