import express from "express";
import cookieParser from "cookie-parser";


const app = express();
const port = 3000;

app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Demo');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});