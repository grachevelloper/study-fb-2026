const express = require("express");
const cors = require("cors");

const logger = require("./middleware/logger");
const productsRouter = require("./routes/products");

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());                    
app.use(express.json());            
app.use(logger);                    

app.get("/", (req, res) => {
  res.json({
    message: "Добро пожаловать в API для управления товарами!",
    endpoints: {
      "GET /api/products": "Получить все товары",
      "GET /api/products/:id": "Получить товар по ID",
      "POST /api/products": "Создать новый товар",
      "PATCH /api/products/:id": "Обновить товар",
      "DELETE /api/products/:id": "Удалить товар"
    }
  });
});


app.use("/api/products", productsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});


app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен: http://localhost:${PORT}`);
  console.log(`📚 API доступно по адресу: http://localhost:${PORT}/api/products`);
});