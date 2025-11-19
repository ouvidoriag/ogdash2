# 🐧 Instalação e Execução no Linux

Guia completo para instalar e rodar o Dashboard de Ouvidoria em Linux.

---

## 📋 Pré-requisitos

### 1. Node.js 18+ e npm

**Ubuntu/Debian:**
```bash
# Atualizar pacotes
sudo apt update

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node -v  # Deve mostrar v18.x.x ou superior
npm -v
```

**CentOS/RHEL:**
```bash
# Instalar Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verificar instalação
node -v
npm -v
```

**Outras distribuições:**
- Baixe do site oficial: https://nodejs.org/
- Ou use nvm (Node Version Manager): https://github.com/nvm-sh/nvm

---

## 🚀 Instalação Rápida

### 1. Navegar até o diretório do projeto
```bash
cd NOVO
```

### 2. Dar permissão de execução aos scripts
```bash
chmod +x *.sh
```

### 3. Instalar dependências
```bash
npm install
```

### 4. Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo (se existir)
cp .env.example .env

# Ou criar manualmente
nano .env
```

**Variáveis necessárias no `.env`:**
```env
# MongoDB Atlas (obrigatório)
MONGODB_ATLAS_URL=mongodb+srv://usuario:senha@cluster.mongodb.net/database?retryWrites=true&w=majority

# Porta do servidor (opcional, padrão: 3000)
PORT=3000

# Gemini AI (opcional)
GEMINI_API_KEY=sua-chave-aqui
```

### 5. Gerar cliente Prisma
```bash
npm run prisma:generate
```

---

## ▶️ Executar o Dashboard

### Opção 1: Executar em primeiro plano (terminal)
```bash
./start.sh
```

Ou diretamente:
```bash
npm start
```

**Para parar:** Pressione `Ctrl+C`

---

### Opção 2: Executar em background (recomendado para produção)
```bash
./start-background.sh
```

O servidor rodará em background e continuará mesmo após fechar o terminal.

**Verificar status:**
```bash
./status.sh
```

**Ver logs:**
```bash
tail -f dashboard.log
```

**Parar:**
```bash
./stop.sh
```

**Reiniciar:**
```bash
./restart.sh
```

---

## 🔧 Usando systemd (Produção)

Para rodar como serviço do sistema (inicia automaticamente ao boot):

### 1. Criar arquivo de serviço
```bash
sudo nano /etc/systemd/system/dashboard-ouvidoria.service
```

### 2. Adicionar conteúdo:
```ini
[Unit]
Description=Dashboard Ouvidoria Duque de Caxias
After=network.target

[Service]
Type=simple
User=seu-usuario
WorkingDirectory=/caminho/para/Dashboard/NOVO
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Ajustar:**
- `User`: seu usuário Linux
- `WorkingDirectory`: caminho completo para a pasta NOVO
- `ExecStart`: caminho do npm (verificar com `which npm`)

### 3. Recarregar systemd e iniciar
```bash
# Recarregar configurações
sudo systemctl daemon-reload

# Habilitar para iniciar no boot
sudo systemctl enable dashboard-ouvidoria.service

# Iniciar serviço
sudo systemctl start dashboard-ouvidoria.service

# Verificar status
sudo systemctl status dashboard-ouvidoria.service
```

### 4. Comandos úteis
```bash
# Parar
sudo systemctl stop dashboard-ouvidoria.service

# Reiniciar
sudo systemctl restart dashboard-ouvidoria.service

# Ver logs
sudo journalctl -u dashboard-ouvidoria.service -f

# Desabilitar inicialização automática
sudo systemctl disable dashboard-ouvidoria.service
```

---

## 🔍 Verificar se está funcionando

### 1. Verificar se o servidor está rodando
```bash
# Ver processos Node.js
ps aux | grep node

# Ver porta 3000
netstat -tuln | grep 3000
# ou
ss -tuln | grep 3000
```

### 2. Testar acesso
```bash
# Localmente
curl http://localhost:3000/api/health

# De outro computador (substituir IP)
curl http://SEU_IP:3000/api/health
```

### 3. Acessar no navegador
```
http://localhost:3000
# ou
http://SEU_IP:3000
```

---

## 🛠️ Troubleshooting

### Porta já em uso
```bash
# Ver qual processo está usando a porta
sudo lsof -i :3000
# ou
sudo netstat -tulpn | grep 3000

# Matar processo (substituir PID)
kill -9 PID
```

### Erro de permissão
```bash
# Dar permissão aos scripts
chmod +x *.sh

# Se necessário, dar permissão ao diretório
chmod -R 755 .
```

### Erro ao conectar no MongoDB
- Verificar se `MONGODB_ATLAS_URL` está correto no `.env`
- Verificar se o IP está liberado no MongoDB Atlas
- Verificar credenciais

### Erro do Prisma
```bash
# Regenerar cliente Prisma
npm run prisma:generate

# Se necessário, fazer push do schema
npm run prisma:push
```

### Ver logs detalhados
```bash
# Se rodando em background
tail -f dashboard.log

# Se usando systemd
sudo journalctl -u dashboard-ouvidoria.service -f
```

---

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `start.sh` | Inicia o servidor em primeiro plano |
| `start-background.sh` | Inicia o servidor em background |
| `stop.sh` | Para o servidor em background |
| `restart.sh` | Reinicia o servidor |
| `status.sh` | Mostra status do servidor |

---

## 🔒 Segurança (Produção)

### 1. Firewall
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3000/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### 2. Nginx como proxy reverso (recomendado)
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. HTTPS com Let's Encrypt
```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com
```

---

## 📚 Comandos NPM Úteis

```bash
# Iniciar servidor
npm start

# Gerar Prisma
npm run prisma:generate

# Prisma Studio (interface visual do banco)
npm run prisma:studio

# Limpar cache
npm run cache:clear

# Importar dados do Excel
npm run update:excel
```

---

## ✅ Checklist de Instalação

- [ ] Node.js 18+ instalado
- [ ] npm instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado
- [ ] Cliente Prisma gerado (`npm run prisma:generate`)
- [ ] Scripts com permissão de execução (`chmod +x *.sh`)
- [ ] Servidor iniciado e acessível
- [ ] Firewall configurado (produção)
- [ ] Serviço systemd configurado (opcional, produção)

---

**Pronto!** Seu Dashboard está rodando em Linux! 🎉

