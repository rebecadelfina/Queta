@echo off
REM ============================================
REM TESTE RÁPIDO - ENDPOINTS DE PAGAMENTO
REM ============================================
REM Script Windows para testar pagamentos
REM 
REM Pré-requisitos: curl (Windows 10+) ou Git Bash

setlocal enabledelayedexpansion

set API_URL=http://localhost:3000/api
set USER_ID=admin

echo.
echo ╔════════════════════════════════════════╗
echo ║  TESTE DE ENDPOINTS DE PAGAMENTO       ║
echo ║  (Sistema Windows)                      ║
echo ╚════════════════════════════════════════╝
echo.

REM ============================================
REM 1. CRIAR PAGAMENTO
REM ============================================
echo 📝 1. Criando novo pagamento...
curl -s -X POST "%API_URL%/payments/create" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"%USER_ID%\", \"plan\": \"30days\", \"amount\": 149}"
echo.

REM ============================================
REM 2. CRIAR TRANSFERÊNCIA BANCÁRIA
REM ============================================
echo 🏦 2. Criando transferência bancária...
curl -s -X POST "%API_URL%/payments/bank-transfer" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\": \"%USER_ID%\", \"plan\": \"7days\", \"amount\": 49}"
echo.

REM ============================================
REM 3. LISTAR PAGAMENTOS DO USUÁRIO
REM ============================================
echo 📋 3. Listando pagamentos do usuário %USER_ID%...
curl -s -X GET "%API_URL%/payments/user/%USER_ID%"
echo.

REM ============================================
REM 4. ATUALIZAR SUBSCRIÇÃO
REM ============================================
echo 🔄 4. Ativando subscrição premium...
REM Para datas, você pode usar um site ou ferramenta
REM Exemplo de datas hardcoded por 30 dias
curl -s -X PUT "%API_URL%/users/%USER_ID%/subscription" ^
  -H "Content-Type: application/json" ^
  -d "{\"active\": true, \"plan\": \"30days\", \"paymentStatus\": \"approved\"}"
echo.

echo.
echo ╔════════════════════════════════════════╗
echo ║     ✅ TESTES COMPLETOS!               ║
echo ║                                        ║
echo ║ Para usar este script:                 ║
echo ║ 1. Abra Command Prompt/PowerShell      ║
echo ║ 2. Navegue até este diretório          ║
echo ║ 3. Execute: test-payment-api.bat       ║
echo ║                                        ║
echo ║ Certifique-se que:                     ║
echo ║ - npm run server está rodando          ║
echo ║ - API está em http://localhost:3000    ║
echo ╚════════════════════════════════════════╝
echo.

pause
