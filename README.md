# gijirog

Learning project: Discord bot for meeting minutes with AWS - 議事録作成Bot

## Overview

Discord の音声チャンネルでのミーティングを録音し、議事録作成を支援する Bot。AWS の各種サービスを学びながら構築する学習プロジェクト。

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

## Tech Stack

- Language: Python
- Bot framework: discord.py
- Infrastructure: AWS (ECS Fargate, S3, ECR, EventBridge/Lambda)
- Containerization: Docker

## Future Ideas

- Amazon Transcribe / Whisper による自動文字起こし
- Bedrock (Claude) による議事録要約
- Amazon Polly による音声発話（ファシリテーション機能）
- Notta API 連携による自動書き起こし
- 過去の議事録検索
- リアルタイム文字起こし表示
