# Comandos para Cerrar Puertos de Desarrollo

## 🔧 Cerrar Puertos Específicos

### 1. Verificar qué procesos están usando los puertos
```powershell
# Verificar puerto 5173
netstat -ano | findstr :5173

# Verificar puerto 5174
netstat -ano | findstr :5174

# Verificar puerto 5175
netstat -ano | findstr :5175
```

### 2. Cerrar procesos por PID
```powershell
# Cerrar proceso específico (reemplazar XXXX con el PID)
taskkill /PID XXXX /F

# Ejemplo:
taskkill /PID 17908 /F
```

### 3. Cerrar todos los procesos de Node.js
```powershell
# Cerrar todos los procesos de Node.js
taskkill /IM node.exe /F
```

### 4. Cerrar todos los procesos de Vite
```powershell
# Cerrar todos los procesos de Vite
taskkill /IM vite.exe /F
```

## 🚀 Comandos Rápidos

### Cerrar puertos comunes de desarrollo
```powershell
# Cerrar puertos 5173, 5174, 5175
taskkill /PID $(netstat -ano | findstr ":5173\|:5174\|:5175" | findstr "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] }) /F
```

### Verificar todos los puertos en uso
```powershell
# Ver todos los puertos en uso
netstat -ano | findstr "LISTENING"
```

## 📋 Scripts Útiles

### Script básico para cerrar puertos específicos
```powershell
# Crear archivo: close-ports.ps1
$ports = @(5173, 5174, 5175, 3000, 3001, 8080, 8000)

foreach ($port in $ports) {
    Write-Host "Verificando puerto $port..."
    $processes = netstat -ano | findstr ":$port" | findstr "LISTENING"
    
    if ($processes) {
        Write-Host "Puerto $port esta en uso:"
        foreach ($process in $processes) {
            $parts = $process -split '\s+'
            $processId = $parts[-1]
            if ($processId -and $processId -ne "0") {
                Write-Host "  PID: $processId"
                $response = Read-Host "  Cerrar este proceso? (s/n)"
                if ($response -eq "s" -or $response -eq "S") {
                    taskkill /PID $processId /F
                    Write-Host "  Proceso $processId cerrado"
                }
            }
        }
    } else {
        Write-Host "Puerto $port esta libre"
    }
}
```

## 🎯 Situaciones Comunes

### Error: "Puerto ya está en uso"
1. Ejecutar: `netstat -ano | findstr :5173`
2. Identificar el PID
3. Ejecutar: `taskkill /PID XXXX /F`

### Múltiples instancias de desarrollo
1. Ejecutar: `taskkill /IM node.exe /F`
2. Ejecutar: `taskkill /IM vite.exe /F`

### Proceso no responde
1. Usar `/F` para forzar el cierre: `taskkill /PID XXXX /F`
2. Si no funciona, reiniciar el terminal

## 💡 Consejos

- **Siempre verificar** qué proceso está usando el puerto antes de cerrarlo
- **Usar `/F`** para forzar el cierre si el proceso no responde
- **Reiniciar el terminal** si los comandos no funcionan
- **Guardar trabajo** antes de cerrar procesos de desarrollo

## 🔍 Comandos de Diagnóstico

```powershell
# Ver todos los procesos de Node.js
tasklist | findstr node

# Ver todos los procesos de Vite
tasklist | findstr vite

# Ver información detallada de un proceso
tasklist /FI "PID eq XXXX" /V
``` 