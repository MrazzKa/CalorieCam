# PowerShell script to get Windows Wi-Fi IP address
# Usage: .\scripts\get-windows-ip.ps1

$adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and $_.InterfaceDescription -like "*Wi-Fi*" -or $_.InterfaceDescription -like "*Wireless*" }

if ($adapters) {
    foreach ($adapter in $adapters) {
        $ipConfig = Get-NetIPAddress -InterfaceIndex $adapter.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue
        if ($ipConfig) {
            $ip = $ipConfig.IPAddress
            if ($ip -match "^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^10\.") {
                Write-Host $ip
                exit 0
            }
        }
    }
}

# Fallback: get first non-loopback IPv4
$fallback = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" -and ($_.IPAddress -match "^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^10\.") } | Select-Object -First 1).IPAddress
if ($fallback) {
    Write-Host $fallback
    exit 0
}

Write-Host "No suitable IP address found" -ForegroundColor Red
exit 1

