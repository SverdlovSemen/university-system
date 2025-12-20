# Скрипт для быстрого исправления проблемы с процедурой

Write-Host "=== Исправление ошибки типов процедуры ===" -ForegroundColor Cyan
Write-Host ""

# Путь к неправильному файлу
$wrongFile = "src\main\resources\db\migration\
$correctFile = "src\main\resources\db\migration\V9__fix_faculty_procedure_types.sql"

# Проверяем существование неправильного файла
if (Test-Path $wrongFile) {
    Write-Host "Найден неправильный файл миграции: $wrongFile" -ForegroundColor Yellow
    Write-Host "Удаляем..." -ForegroundColor Yellow
    Remove-Item $wrongFile -Force
    Write-Host "✓ Удалено" -ForegroundColor Green
} else {
    Write-Host "Неправильный файл не найден (это хорошо)" -ForegroundColor Green
}

Write-Host ""

# Проверяем существование правильного файла
if (Test-Path $correctFile) {
    Write-Host "✓ Правильный файл миграции найден: $correctFile" -ForegroundColor Green
} else {
    Write-Host "✗ ОШИБКА: Правильный файл миграции не найден!" -ForegroundColor Red
    Write-Host "Создайте файл $correctFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Теперь перезапустите backend ===" -ForegroundColor Cyan
Write-Host "Выполните команду:" -ForegroundColor White
Write-Host "  .\gradlew bootRun" -ForegroundColor Yellow
Write-Host ""
Write-Host "Или примените SQL вручную:" -ForegroundColor White
Write-Host "  psql -U postgres -d university_system -f update_faculty_procedure.sql" -ForegroundColor Yellow
Write-Host ""

