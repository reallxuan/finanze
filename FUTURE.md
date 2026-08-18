# Future: chain + address wallet monitoring

当前版本不通过链上地址自动发现或同步钱包余额。手动加密资产仍然可以保存并按现有报价逻辑更新。

后续钱包监控的输入和存储模型为 `{ chain, address }`，不需要登录或连接第三方 Entity。首批支持 BTC、ETH、LTC、TRON、BSC，并沿用 App 前台恢复、手动刷新和 2 分钟冷却策略。

输出字段：

- 资产：`token`、`name`、`symbol`、`contractAddress`、`amount`、`usdValue`
- 钱包汇总：`totalUsdValue`
- 数据时间：`fetchedAt`

ETH、BSC、TRON 返回原生币和 Token；BTC、LTC 只返回原生资产。其他链、NFT、DeFi 仓位以及多地址聚合不属于首期范围。

# Known limitation: MPF 基金数据目前只支持永明（Sun Life）

`MpfPortfolio`（[finanze/domain/mpf.py](finanze/domain/mpf.py)）的 `entity_id`（机构）和 `scheme`（基金数据来源）是两个互不关联的字段：

- **Institution / 受托人机构**：只是用户手动创建的一个实体，纯展示/归类用途，不影响基金数据来源。
- **Target allocation 的基金列表**：无论选择哪个机构，前端始终发送写死的 `scheme = "MPF"`（[frontend/app/src/components/mpf/CreateMpfPortfolioDialog.tsx](frontend/app/src/components/mpf/CreateMpfPortfolioDialog.tsx)），后端 `GetMpfFundQuotesImpl` 也硬编码只接了 `SunLifeMpfClient` 一个数据源（[finanze/application/use_cases/get_mpf_fund_quotes.py](finanze/application/use_cases/get_mpf_fund_quotes.py)），没有做多受托人的抽象。

也就是说，无论"机构"填成汇丰、恒生还是任何名字，能选的基金净值永远来自永明。如果真的用于跟踪非永明的 MPF 账户，基金代码和净值对不上，数据是假的。

**临时缓解措施**：新建 MPF 账户时，弹窗先询问用户"是否创建永明 MPF"，选"否"直接退出，避免误建出数据不匹配的账户（已实现于 `CreateMpfPortfolioDialog.tsx`）。

**真正的修复需要**：把 `MpfPort`/`GetMpfFundQuotes` 抽象成支持多受托人的基金数据源（每个 `scheme` 对应一个 client 实现），或者干脆去掉"自动拉取净值"这个假设，改成手动输入基金净值——这样天然支持任意受托人，不需要为每家 MPF 供应商写爬虫/客户端。
