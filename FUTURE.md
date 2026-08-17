# Future: chain + address wallet monitoring

当前版本不通过链上地址自动发现或同步钱包余额。手动加密资产仍然可以保存并按现有报价逻辑更新。

后续钱包监控的输入和存储模型为 `{ chain, address }`，不需要登录或连接第三方 Entity。首批支持 BTC、ETH、LTC、TRON、BSC，并沿用 App 前台恢复、手动刷新和 2 分钟冷却策略。

输出字段：

- 资产：`token`、`name`、`symbol`、`contractAddress`、`amount`、`usdValue`
- 钱包汇总：`totalUsdValue`
- 数据时间：`fetchedAt`

ETH、BSC、TRON 返回原生币和 Token；BTC、LTC 只返回原生资产。其他链、NFT、DeFi 仓位以及多地址聚合不属于首期范围。
