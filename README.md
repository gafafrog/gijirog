# gijirog

Discord の音声チャンネルでミーティングを録音し、議事録作成を支援する Bot。

> 🚧 開発中 — プロジェクトの背景・方針・進捗は [docs/](docs/) を参照。

## MVP

- Discord 音声チャンネルに参加して録音
- 音声ファイルを S3 に保存
- Discord テキストチャンネルにダウンロードリンクを通知
- 文字起こしは外部サービスで行う前提

## Architecture (MVP)

```
Discord 音声チャンネル
  |
  v
ECS Fargate (Bot)
  |
  v
S3 (音声ファイル保存)
  |
  v
Discord テキストチャンネルにリンク通知
```

## 技術スタック

- 言語: Python
- Bot フレームワーク: discord.py
- インフラ: AWS (ECS Fargate, S3, ECR, EventBridge/Lambda)
- コンテナ化: Docker

## ローカル開発

### 前提（管理者側で整っていること）

- AWS アカウントが作成され、IAM Identity Center が有効
- Discord アプリケーション（Bot）が登録されている
- SSM Parameter Store に以下のパラメータが投入されている:
  - `/gijirog/dev/DISCORD_TOKEN` (SecureString) — Discord Bot トークン
  - `/gijirog/dev/DISCORD_GUILD_ID` (String) — テストサーバーの Guild ID
- IdC に次の権限を持つ Permission Set が作成され、開発者ユーザーに割り当てられている:

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "ReadGijirogDevParameters",
        "Effect": "Allow",
        "Action": "ssm:GetParameter",
        "Resource": "arn:aws:ssm:<REGION>:<ACCOUNT_ID>:parameter/gijirog/dev/*"
      },
      {
        "Sid": "DecryptViaSsm",
        "Effect": "Allow",
        "Action": "kms:Decrypt",
        "Resource": "*",
        "Condition": {
          "StringEquals": {
            "kms:ViaService": "ssm.<REGION>.amazonaws.com"
          }
        }
      }
    ]
  }
  ```

### 開発者の初期設定

- AWS CLI v2 / [uv](https://docs.astral.sh/uv/) / Docker Desktop のインストール
- `aws configure sso` で SSO プロファイルを作成し、プロファイル名を `AWS_PROFILE` にセット:

  ```bash
  export AWS_PROFILE=<your-profile-name>
  ```

### Bot をローカルで起動する

```bash
aws sso login   # SSO セッションが切れていれば
./scripts/run-dev.sh
```

`run-dev.sh` は SSM から secrets を取得し、自プロセスの環境変数に export してから Bot を `exec` します。ディスクには何も書きません。

### Bot を Docker で起動する

```bash
docker build -t gijirog:dev .
aws sso login   # SSO セッションが切れていれば
./scripts/run-dev-container.sh
```

`run-dev-container.sh` はホスト側で SSM から secrets を取得し、`docker run` の環境変数としてコンテナに渡します。secrets はイメージには含めません。
