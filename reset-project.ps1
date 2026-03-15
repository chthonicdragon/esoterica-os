# Скрипт для безопасного сброса node_modules и кэша Vite

# 1. Останавливаем все процессы node/vite, если они есть
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Удаляем кэш Vite, если он существует
$viteCache = ".\node_modules\.vite"
if (Test-Path $viteCache) {
    Write-Host "Удаляю кэш Vite..."
    Remove-Item -Recurse -Force $viteCache
} else {
    Write-Host "Кэш Vite не найден, пропускаем."
}

# 3. Удаляем node_modules безопасно
$nodeModules = ".\node_modules"
if (Test-Path $nodeModules) {
    Write-Host "Удаляю node_modules..."
    # Удаляем только то, что можем, игнорируя заблокированные файлы
    Get-ChildItem $nodeModules -Recurse -Force | ForEach-Object {
        try {
            Remove-Item $_.FullName -Recurse -Force -ErrorAction Stop
        } catch {
            Write-Warning "Не удалось удалить $_.FullName — пропускаем."
        }
    }
} else {
    Write-Host "node_modules не найден, пропускаем."
}

# 4. Переустанавливаем зависимости
Write-Host "Устанавливаю зависимости..."
npm install

# 5. Завершение
Write-Host "Сброс проекта завершён! Теперь запусти dev-сервер: npm run dev"