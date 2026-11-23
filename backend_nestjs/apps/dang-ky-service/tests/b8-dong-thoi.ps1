param(
  [Parameter(Mandatory = $true)][int]$MaDK1,
  [Parameter(Mandatory = $true)][int]$MaDK2,
  [string]$Gateway = "http://localhost:3000",
  [string]$MatKhau = "Test@12345"
)

function Login($user) {
  $body = @{ username = $user; password = $MatKhau } | ConvertTo-Json
  (Invoke-RestMethod -Method Post -Uri "$Gateway/auth/login" `
    -ContentType "application/json" -Body $body).access_token
}

$t1 = Login "gv01"
$t2 = Login "gv02"

# Hai job cùng chờ tới một thời điểm rồi bắn đồng thời
$batDau = (Get-Date).AddSeconds(6).Ticks

$viec = {
  param($url, $token, $batDau)
  while ([DateTime]::Now.Ticks -lt $batDau) { Start-Sleep -Milliseconds 1 }
  try {
    $r = Invoke-RestMethod -Method Patch -Uri $url `
      -Headers @{ Authorization = "Bearer $token" }
    "200 $($r.trangThai)"
  } catch {
    $code = [int]$_.Exception.Response.StatusCode
    "$code $($_.ErrorDetails.Message)"
  }
}

$j1 = Start-Job -ScriptBlock $viec -ArgumentList "$Gateway/dang-ky/$MaDK1/duyet", $t1, $batDau
$j2 = Start-Job -ScriptBlock $viec -ArgumentList "$Gateway/dang-ky/$MaDK2/duyet", $t2, $batDau

Write-Host "Dang cho 2 request ban dong thoi..."
Wait-Job $j1, $j2 | Out-Null
Write-Host "GV01 duyet dang ky $MaDK1 -> " (Receive-Job $j1)
Write-Host "GV02 duyet dang ky $MaDK2 -> " (Receive-Job $j2)
Remove-Job $j1, $j2