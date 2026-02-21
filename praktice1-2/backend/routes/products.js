const express = require("express");
const router = express.Router();

let products = require("../data/products");


function findById(id) {
  const num = Number(id);
  if (Number.isNaN(num)) return null;
  return products.find((p) => p.id === num) || null;
}


router.get("/", (req, res) => {
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});


router.get("/:id", (req, res) => {
  const product = findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Товар не найден" });
  res.json({ success: true, data: product });
});


router.post("/", (req, res) => {
  const { title, price } = req.body;


  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "Название обязательно и должно быть строкой" });
  }


  const numPrice = Number(price);
  if (Number.isNaN(numPrice) || numPrice < 0) {
    return res.status(400).json({ error: "Стоимость обязательна и должна быть числом >= 0" });
  }


  const nextId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = { id: nextId, title: title.trim(), price: numPrice };

  products.push(newProduct);
  res.status(201).json({ success: true, message: "Товар создан", data: newProduct });
});


router.patch("/:id", (req, res) => {
  const product = findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Товар не найден" });

  const { title, price } = req.body;


  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Название должно быть непустой строкой" });
    }
    product.title = title.trim();
  }


  if (price !== undefined) {
    const numPrice = Number(price);
    if (Number.isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: "Стоимость должна быть числом >= 0" });
    }
    product.price = numPrice;
  }

  res.json({ success: true, message: "Товар обновлен", data: product });
});


router.delete("/:id", (req, res) => {
  const before = products.length;
  const id = Number(req.params.id);
  
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID должен быть числом" });
  }

  products = products.filter((p) => p.id !== id);

  if (products.length === before) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  res.json({ success: true, message: "Товар удален" });
});

module.exports = router;