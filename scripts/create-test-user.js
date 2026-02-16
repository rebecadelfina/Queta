#!/usr/bin/env node
/**
 * Script para criar um usuário de teste com pagamento pendente
 * Uso: node scripts/create-test-user.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const userStoragePath = path.join(__dirname, '../storage/users.json');
const projectRoot = path.join(__dirname, '..');

// Garantir que pasta storage existe
const storageDir = path.join(projectRoot, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Função para gerar ID único
function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Função para carregar usuários
function loadUsers() {
  try {
    if (fs.existsSync(userStoragePath)) {
      const data = fs.readFileSync(userStoragePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erro ao carregar usuários:', error.message);
  }
  return [];
}

// Função para salvar usuários
function saveUsers(users) {
  try {
    fs.writeFileSync(userStoragePath, JSON.stringify(users, null, 2));
    console.log('✓ Arquivo salvo:', userStoragePath);
  } catch (error) {
    console.error('Erro ao salvar usuários:', error.message);
  }
}

// Criar novo usuário de teste
function createTestUser() {
  const testUserId = generateId();
  const now = new Date().toISOString();
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const testUser = {
    id: testUserId,
    username: "testeuser",
    password: "senha123", // ⚠️ Apenas para teste
    displayName: "Teste - Pagamento Pendente",
    photoUri: "https://i.pravatar.cc/150?img=5",
    isAdmin: false,
    trialStart: now,
    subscription: {
      active: true,
      plan: "7days",
      startDate: now,
      endDate: endDate,
      paymentStatus: "pending",
      paymentProofUri: null
    },
    createdAt: now
  };

  return testUser;
}

// Main
console.log('\n📝 Criando usuário de teste com pagamento pendente...\n');

try {
  const users = loadUsers();
  
  // Verificar se usuário de teste já existe
  const existingTest = users.find(u => u.username === 'testeuser');
  if (existingTest) {
    console.log('⚠️  Usuário de teste já existe!');
    console.log('ID:', existingTest.id);
    console.log('Status de Pagamento:', existingTest.subscription.paymentStatus);
  } else {
    const testUser = createTestUser();
    users.push(testUser);
    saveUsers(users);
    
    console.log('✅ Usuário de teste criado com sucesso!\n');
    console.log('📌 CREDENCIAIS DE TESTE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Usuário:', testUser.username);
    console.log('Senha:', testUser.password);
    console.log('Nome:', testUser.displayName);
    console.log('ID:', testUser.id);
    console.log('Plan:', testUser.subscription.plan);
    console.log('Status Pagamento:', testUser.subscription.paymentStatus);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 PRÓXIMOS PASSOS:');
    console.log('1. Faça login com "testeuser" / "senha123"');
    console.log('2. Vá ao painel admin (se tiver acesso)');
    console.log('3. Visualize o pagamento pendente');
    console.log('4. Aprove ou rejeite o pagamento\n');
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
