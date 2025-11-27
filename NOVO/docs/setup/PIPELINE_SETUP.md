# Setup do Pipeline Python

Este projeto usa Python para processar dados do Google Sheets. O Python será instalado automaticamente quando você executar `npm install` ou `npm run setup:python`.

## Instalação Automática

### Linux (Ubuntu/Debian)
```bash
npm install
# O script tentará instalar Python automaticamente via apt-get
```

### Windows
```bash
npm install
# O script tentará instalar Python via winget ou Chocolatey
```

## Instalação Manual

Se a instalação automática falhar, instale Python manualmente:

### Linux
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip
```

### Windows
1. Baixe Python de: https://www.python.org/downloads/
2. Durante a instalação, marque "Add Python to PATH"
3. Reinicie o terminal

## Instalar Dependências Python

Após instalar Python, execute:

```bash
npm run setup:python
```

Ou manualmente:

```bash
pip install -r ../Pipeline/requirements.txt
```

## Verificar Instalação

```bash
python --version
# ou
python3 --version
```

## Executar Pipeline

```bash
npm run pipeline
```

O pipeline irá:
1. Executar o script Python (`Pipeline/main.py`)
2. Processar dados do Google Sheets
3. Salvar no banco de dados

## Troubleshooting

### Python não encontrado
```bash
# Verificar se Python está no PATH
which python3  # Linux
where python   # Windows

# Se não estiver, adicione ao PATH ou reinstale
```

### Erro ao instalar dependências
```bash
# Tentar com pip3
pip3 install -r ../Pipeline/requirements.txt

# Ou com python -m pip
python -m pip install -r ../Pipeline/requirements.txt
```

### Permissões no Linux
```bash
# Se precisar de sudo
sudo pip3 install -r ../Pipeline/requirements.txt

# Ou instalar para usuário
pip3 install --user -r ../Pipeline/requirements.txt
```

