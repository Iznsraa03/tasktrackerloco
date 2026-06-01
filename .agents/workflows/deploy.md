---
description: Workflow otomatis untuk melakukan deployment project Node.js ke server production menggunakan SSH, Git pull, instalasi dependensi, dan restart proses menggunakan PM2 tanpa Docker.
---

name: Deploy Node.js Project via PM2
description: Automated deployment for Node.js application using PM2 and direct SSH

on:
  push:
    branches:
      - main

jobs:
  deploy:
    name: Production Deployment
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Execute Deployment Commands via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: 103.93.160.99
          username: koinshop
          port: 22
          key: |
            -----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAq6i7YTTBzp9hsphobeOKifdJ3TIrF+TkoY1RV0GEq34vM5rO
kbUDFNiWjgiMRZJMSMKkzExwulayTQeSVJkTWvgAECgTGNLnZh2qrvb7d6ydwk66
Btza6EM99vpN2hWBWMImlMZxueXNkzQAx307bqqCssDCdHBPVGvAPYf/vtghjw5y
F+MlsJgbyRc9xQjeSdMlmvs0YyxAdsfJP6k4zMLg5rLvmHQjAtQ28bcXY3w5lNIU
zNjgy+UYg/Gf9qZM3PAp8qqlxx+5veDySPpN75bQx2fKn9nDC8O82P+rJ7X9FjNN
awXtO3OjJWAlXO/Fdi2sw4x2DSDuMb68jqkzZQIDAQABAoIBABAtb7NX2yf+N0vd
4dbxXx4PfcOTNc0jrN8DcstWs7UhyDsEd5FIeN40Z0PteaLDiIhBknG6hn6D1dE9
ScTKmbC0t0oj12Dl3MRFPs+3G7iJ6Q2QiSbvwNBWKKHSXGyVeEIwJ0iqxw8DoZ3M
2ddIbcXJMKtopSrUvB/do8QTbBPFIn6nJeSFrxR0tTAsFQ8f8Gh4mU23Pdr54OQm
ENGW8cLRa0wgyXs6faG3kOeGVX+p63W4MNGH+ztLCO1wET5/mRrJXd3Nw2LzGcQL
4r5451SCyjA997NY2vzPu3M1WqKhbwXCutOrbKPiCId9PbQQ1YDVotsk16nG9OKG
mAupm8ECgYEA0coEiZNtBqQdDaHdKWlctM2vpciPAVy0ERcRj/Ff/OuW+pA/1WfK
wYM2Cumy6wbQVY+bMg8vCgrjoLYA0hJPbCzqDwoiyQCJFUME2jk3UK4GD/CK3Cva
51dJ4jvQ/PvLOypmM3L8CR+EnhC9olSUuUCwgPrNPc358LD5ycUNgZUCgYEA0XiR
MACP5CF57F0j5Ryrubj/p9kkcSlTLVBrSUccibA2mj49e+zTSocD3/Ec7lBJ4y3A
cebfH7g4rp8MejmwPk3MhRQfTrdCipibSn1WrboQsJOLS0Ve2l1j8clDmsKtI02k
0RX3x22Ely3KLxYtXJPciwrCZEDP6743uS1gFpECgYEAzM+7akzhze/+5UY3Uqyo
c2OzrdiFtMC6k0zAOpVeLuAZ//lAOKoiCpZ89l597HI0hrOywkaMl/NVk5rcZjq2
C1g2EgTFPRMmwfkyDZJ6bGvZQ0qFZrnx9pUDbrkTKUjxeovER0pkwMtif6a8XHTS
1aFQMDuqkEI9VzyQQOn+a5kCgYEAq6z00TKku4P0ORPc51moJH7KiPYeN+B2mxzd
0SDG8tHI7oE0QuzF/r7JHjCuVWLYK6jDoJZnJ8gELJmN0F6XY3i/thHX1tu7XXvV
SiePcrKcGxvRfc9M/gqsbu1UyvHilJx+CB7JBFlt4blVi2HRq55DknEvAJtdzQgJ
A2t85QECgYBj/orMatXvk8BS4KPe6q608vNcG68OZd+6rV2S1W5QEuErDKz3080l
+UHqmbHJGgz6qPHDgkx+xkxzSkWuDiU3A9l+LJBt6Cnfrjj6fiPzaSZ9HQS7tPvC
bhJsZC+EjaEjzwKFKakQ7ZY9D1QNnTwHjofZrB8Ckbbrkgkv28Hl5Q==
-----END RSA PRIVATE KEY-----
          script: |
            # Masuk ke direktori project Anda (sesuaikan path ini)
            cd /home/koinshop/your-project-folder
            
            # Tarik perubahan terbaru dari repository
            git pull origin main
            
            # Load environment manager (nvm) jika digunakan di server
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            
            # Install dependensi produksi
            npm install --production
            
            # Restart aplikasi menggunakan PM2
            pm2 reload app-name || pm2 start server.js --name "app-name"
            
            # Simpan state PM2
            pm2 save