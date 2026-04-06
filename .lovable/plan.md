
## 既存機能との対応表

| 要件 | 既存の機能 | 必要な作業 |
|------|-----------|-----------|
| ①出店候補地登録 | StoreInput.tsx（店舗名/業種/住所あり） | **緯度・経度・メモ欄の追加 + 候補地専用DBテーブル作成** |
| ②商圏分析 | AreaAnalysis.tsx（半径切替/人口/年齢/世帯/競合/AIコメント全て実装済み） | **変更不要（既に完成）** |
| ③媒体プラン | AdProposal.tsx（Google/Meta）+ FlyerPlan.tsx（チラシ） | **統合ビュー「MediaPlan」ページを新設し、3タブで横断的に見られるように** |
| ④代理店ダッシュボード | Dashboard.tsx（個人用の診断一覧） | **AgencyDashboard新設（テーブル形式、クライアント名/ステータス/分析日時）** |
| ⑤レポート | 各分析結果がバラバラ | **Report新設（商圏+施策+広告+チラシを1ページ集約）** |

## 実装計画

### 1. DB: `store_candidates` テーブル作成
- 店舗名, 業種, 住所, 緯度, 経度, メモ, user_id
- RLSポリシー付き

### 2. `StoreCandidateInput` ページ新設
- 緯度/経度/メモフィールド付きフォーム
- DB保存 → 候補地一覧表示
- API対応構造（fetch関数 + loading/error/empty状態）

### 3. `MediaPlan` ページ新設
- Meta広告 / Google広告 / チラシ の3タブ
- 既存のAdProposal・FlyerPlanのEdge Functionを再利用
- 統合ビューで予算・ターゲット・キーワード・配布計画を一覧表示

### 4. `AgencyDashboard` ページ新設
- テーブル形式の案件一覧（クライアント名/店舗名/業種/分析日時/ステータス）
- 既存diagnoses + store_candidatesのデータを統合表示
- フィルタリング・ソート機能

### 5. `Report` ページ新設
- 商圏分析結果 + 推奨施策 + 広告配分 + チラシ出稿案を1ページに集約
- APIレスポンスを受け取る構造
- PDF出力ボタン付き

### 技術方針
- すべてのデータ取得を `async fetch関数` 経由に統一
- 各ページに loading / error / empty 状態を実装
- Supabase / 外部API接続しやすいService Layer構造
