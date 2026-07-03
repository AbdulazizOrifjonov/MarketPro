import 'dotenv/config';
import app from './app.js';
import { startBot } from './services/telegram.service.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MarketPro API running on http://localhost:${PORT}`);
  startBot();
});
