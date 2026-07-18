import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './db';
import { PayoutService } from './services/payoutService';
import { verifyToken, isAdmin, AuthRequest } from './middleware/auth';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// AUTHENTICATION
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'USER' }
    });
    
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// USERS
app.get('/api/users/dashboard', verifyToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        sales: { orderBy: { createdAt: 'desc' } },
        transactions: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SALES
app.post('/api/sales', verifyToken, async (req: AuthRequest, res): Promise<void> => {
  const { amount, productName, customerName } = req.body;
  try {
    const sale = await prisma.sale.create({
      data: { 
        userId: req.user!.id, 
        amount: parseFloat(amount),
        productName,
        customerName
      }
    });
    
    // Immediately process advance payout for this new sale
    await PayoutService.processAdvances();
    
    res.json(sale);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Admin ONLY: Get all sales
app.get('/api/sales', verifyToken, isAdmin, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({ 
      include: { user: { select: { email: true, name: true } } }, 
      orderBy: { createdAt: 'desc' } 
    });
    res.json(sales);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// Admin ONLY: Reconcile
app.post('/api/sales/:id/reconcile', verifyToken, isAdmin, async (req, res) => {
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  try {
    const result = await PayoutService.reconcileSale(req.params.id, status);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Withdrawals
app.post('/api/withdrawals', verifyToken, async (req: AuthRequest, res) => {
  const { amount } = req.body;
  try {
    const result = await PayoutService.requestWithdrawal(req.user!.id, parseFloat(amount));
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// For local testing convenience - reset 24h timer (User only resets own timer)
app.post('/api/users/reset-timer', verifyToken, async (req: AuthRequest, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user!.id },
            data: { lastWithdrawalAt: null }
        });
        res.json({ success: true });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
