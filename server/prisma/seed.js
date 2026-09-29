import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma=new PrismaClient();
const poojas=[
 {name:'Ganapathi Pooja',description:'A traditional prayer seeking blessings for new beginnings, wisdom and removal of obstacles.',price:501},
 {name:'Satyanarayana Vratham',description:'A sacred vrata performed for family well-being, peace and prosperity.',price:1101},
 {name:'Rudrabhishekam',description:'A devotional abhishekam to Lord Shiva with traditional offerings and prayers.',price:1501},
 {name:'Kumkumarchana',description:'A traditional archana offered with kumkum and prayers for auspicious blessings.',price:301},
 {name:'Navagraha Pooja',description:'A traditional worship dedicated to the Navagrahas for harmony and well-being.',price:751},
 {name:'Lakshmi Pooja',description:'A devotional pooja to Goddess Lakshmi seeking abundance and family welfare.',price:501}
];
try{for(const p of poojas){const found=await prisma.pooja.findFirst({where:{name:p.name}});if(!found)await prisma.pooja.create({data:p});}if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD,12);await prisma.admin.upsert({where:{email:process.env.ADMIN_EMAIL.toLowerCase()},update:{passwordHash:hash},create:{email:process.env.ADMIN_EMAIL.toLowerCase(),passwordHash:hash}})}console.log('Seed complete')}finally{await prisma.$disconnect()}
