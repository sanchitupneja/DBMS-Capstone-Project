import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { seedAllocations, DEFAULT_ACADEMIC_YEAR } from './seed-allocations';

// Prisma reads DATABASE_URL (mysql://...) from .env or schema.prisma.
const prisma = new PrismaClient();

const RAW_STUDENTS = [
  [1,'Aarav Sharma','aarav.sharma001@gmail.com','9000000001','MALE','Computer Science',1],
  [2,'Ananya Patel','ananya.patel002@gmail.com','9000000002','FEMALE','Electrical Engineering',2],
  [3,'Rohan Verma','rohan.verma003@gmail.com','9000000003','MALE','Mechanical Engineering',3],
  [4,'Diya Nair','diya.nair004@gmail.com','9000000004','FEMALE','Information Technology',4],
  [5,'Kabir Singh','kabir.singh005@gmail.com','9000000005','MALE','Civil Engineering',1],
  [6,'Meera Iyer','meera.iyer006@gmail.com','9000000006','FEMALE','Electronics Engineering',2],
  [7,'Arjun Reddy','arjun.reddy007@gmail.com','9000000007','MALE','Biotechnology',3],
  [8,'Sana Khan','sana.khan008@gmail.com','9000000008','FEMALE','Business Administration',4],
  [9,'Vikram Joshi','vikram.joshi009@gmail.com','9000000009','MALE','Mathematics',1],
  [10,'Priya Das','priya.das010@gmail.com','9000000010','FEMALE','Physics',2],
  [11,'Neel Gupta','neel.gupta011@gmail.com','9000000011','MALE','Computer Science',3],
  [12,'Ishita Rao','ishita.rao012@gmail.com','9000000012','FEMALE','Electrical Engineering',4],
  [13,'Aditya Menon','aditya.menon013@gmail.com','9000000013','MALE','Mechanical Engineering',1],
  [14,'Kavya Bose','kavya.bose014@gmail.com','9000000014','FEMALE','Information Technology',2],
  [15,'Manav Kulkarni','manav.kulkarni015@gmail.com','9000000015','MALE','Civil Engineering',3],
  [16,'Tara Fernandes','tara.fernandes016@gmail.com','9000000016','FEMALE','Electronics Engineering',4],
  [17,'Dev Malhotra','dev.malhotra017@gmail.com','9000000017','MALE','Biotechnology',1],
  [18,'Nisha Chawla','nisha.chawla018@gmail.com','9000000018','FEMALE','Business Administration',2],
  [19,'Samir Ali','samir.ali019@gmail.com','9000000019','MALE','Mathematics',3],
  [20,'Leena Thomas','leena.thomas020@gmail.com','9000000020','FEMALE','Physics',4],
  [21,'Rahul Mehta','rahul.mehta021@gmail.com','9000000021','MALE','Computer Science',1],
  [22,'Pooja Shah','pooja.shah022@gmail.com','9000000022','FEMALE','Electrical Engineering',2],
  [23,'Karan Kapoor','karan.kapoor023@gmail.com','9000000023','MALE','Mechanical Engineering',3],
  [24,'Aisha Siddiqui','aisha.siddiqui024@gmail.com','9000000024','FEMALE','Information Technology',4],
  [25,'Nikhil Bhat','nikhil.bhat025@gmail.com','9000000025','MALE','Civil Engineering',1],
  [26,'Sneha Pillai','sneha.pillai026@gmail.com','9000000026','FEMALE','Electronics Engineering',2],
  [27,'Yash Thakur','yash.thakur027@gmail.com','9000000027','MALE','Biotechnology',3],
  [28,'Riya Mukherjee','riya.mukherjee028@gmail.com','9000000028','FEMALE','Business Administration',4],
  [29,'Harsh Jain','harsh.jain029@gmail.com','9000000029','MALE','Mathematics',1],
  [30,'Anika Roy','anika.roy030@gmail.com','9000000030','FEMALE','Physics',2],
  [31,'Vivaan Desai','vivaan.desai031@gmail.com','9000000031','MALE','Computer Science',3],
  [32,'Aadhya Mishra','aadhya.mishra032@gmail.com','9000000032','FEMALE','Electrical Engineering',4],
  [33,'Siddharth Sinha','siddharth.sinha033@gmail.com','9000000033','MALE','Mechanical Engineering',1],
  [34,'Saanvi Rangan','saanvi.rangan034@gmail.com','9000000034','FEMALE','Information Technology',2],
  [35,'Ishaan Ghosh','ishaan.ghosh035@gmail.com','9000000035','MALE','Civil Engineering',3],
  [36,'Tanvi Bansal','tanvi.bansal036@gmail.com','9000000036','FEMALE','Electronics Engineering',4],
  [37,'Atharv Choudhary','atharv.choudhary037@gmail.com','9000000037','MALE','Biotechnology',1],
  [38,'Mira Krishnan','mira.krishnan038@gmail.com','9000000038','FEMALE','Business Administration',2],
  [39,'Dhruv Saxena','dhruv.saxena039@gmail.com','9000000039','MALE','Mathematics',3],
  [40,'Navya Shetty','navya.shetty040@gmail.com','9000000040','FEMALE','Physics',4],
  [41,'Reyansh Arora','reyansh.arora041@gmail.com','9000000041','MALE','Computer Science',1],
  [42,'Avni Banerjee','avni.banerjee042@gmail.com','9000000042','FEMALE','Electrical Engineering',2],
  [43,'Advik Yadav','advik.yadav043@gmail.com','9000000043','MALE','Mechanical Engineering',3],
  [44,'Myra Dutta','myra.dutta044@gmail.com','9000000044','FEMALE','Information Technology',4],
  [45,'Kiaan Bhattacharya','kiaan.bhattacharya045@gmail.com','9000000045','MALE','Civil Engineering',1],
  [46,'Kiara Sood','kiara.sood046@gmail.com','9000000046','FEMALE','Electronics Engineering',2],
  [47,'Parth Agarwal','parth.agarwal047@gmail.com','9000000047','MALE','Biotechnology',3],
  [48,'Shreya Menon','shreya.menon048@gmail.com','9000000048','FEMALE','Business Administration',4],
  [49,'Ayaan Qureshi','ayaan.qureshi049@gmail.com','9000000049','MALE','Mathematics',1],
  [50,'Vanya Kapoor','vanya.kapoor050@gmail.com','9000000050','FEMALE','Physics',2],
  [51,'Ritvik Prasad','ritvik.prasad051@gmail.com','9000000051','MALE','Computer Science',3],
  [52,'Aditi Narang','aditi.narang052@gmail.com','9000000052','FEMALE','Electrical Engineering',4],
  [53,'Omkar Pawar','omkar.pawar053@gmail.com','9000000053','MALE','Mechanical Engineering',1],
  [54,'Madhuri Kulkarni','madhuri.kulkarni054@gmail.com','9000000054','FEMALE','Information Technology',2],
  [55,'Kushal Rao','kushal.rao055@gmail.com','9000000055','MALE','Civil Engineering',3],
  [56,'Jhanvi Deshmukh','jhanvi.deshmukh056@gmail.com','9000000056','FEMALE','Electronics Engineering',4],
  [57,'Saurabh Tripathi','saurabh.tripathi057@gmail.com','9000000057','MALE','Biotechnology',1],
  [58,'Esha Malhotra','esha.malhotra058@gmail.com','9000000058','FEMALE','Business Administration',2],
  [59,'Varun Bhatia','varun.bhatia059@gmail.com','9000000059','MALE','Mathematics',3],
  [60,'Ira Chatterjee','ira.chatterjee060@gmail.com','9000000060','FEMALE','Physics',4],
  [61,'Pranav Kulkarni','pranav.kulkarni061@gmail.com','9000000061','MALE','Computer Science',1],
  [62,'Bhavna Reddy','bhavna.reddy062@gmail.com','9000000062','FEMALE','Electrical Engineering',2],
  [63,'Anshul Jain','anshul.jain063@gmail.com','9000000063','MALE','Mechanical Engineering',3],
  [64,'Mitali Ghosh','mitali.ghosh064@gmail.com','9000000064','FEMALE','Information Technology',4],
  [65,'Tushar Shetty','tushar.shetty065@gmail.com','9000000065','MALE','Civil Engineering',1],
  [66,'Sakshi Anand','sakshi.anand066@gmail.com','9000000066','FEMALE','Electronics Engineering',2],
  [67,'Raghav Puri','raghav.puri067@gmail.com','9000000067','MALE','Biotechnology',3],
  [68,'Nandini Bose','nandini.bose068@gmail.com','9000000068','FEMALE','Business Administration',4],
  [69,'Keshav Mishra','keshav.mishra069@gmail.com','9000000069','MALE','Mathematics',1],
  [70,'Ritu Sharma','ritu.sharma070@gmail.com','9000000070','FEMALE','Physics',2],
  [71,'Abhinav Das','abhinav.das071@gmail.com','9000000071','MALE','Computer Science',3],
  [72,'Lavanya Iyer','lavanya.iyer072@gmail.com','9000000072','FEMALE','Electrical Engineering',4],
  [73,'Naveen Kumar','naveen.kumar073@gmail.com','9000000073','MALE','Mechanical Engineering',1],
  [74,'Charu Mehta','charu.mehta074@gmail.com','9000000074','FEMALE','Information Technology',2],
  [75,'Gaurav Sethi','gaurav.sethi075@gmail.com','9000000075','MALE','Civil Engineering',3],
  [76,'Swati Nair','swati.nair076@gmail.com','9000000076','FEMALE','Electronics Engineering',4],
  [77,'Akhil Thomas','akhil.thomas077@gmail.com','9000000077','MALE','Biotechnology',1],
  [78,'Payal Shah','payal.shah078@gmail.com','9000000078','FEMALE','Business Administration',2],
  [79,'Mohan Lal','mohan.lal079@gmail.com','9000000079','MALE','Mathematics',3],
  [80,'Komal Verma','komal.verma080@gmail.com','9000000080','FEMALE','Physics',4],
  [81,'Deepak Yadav','deepak.yadav081@gmail.com','9000000081','MALE','Computer Science',1],
  [82,'Farah Khan','farah.khan082@gmail.com','9000000082','MALE','Electrical Engineering',2],
  [83,'Imran Sheikh','imran.sheikh083@gmail.com','9000000083','MALE','Mechanical Engineering',3],
  [84,'Zoya Mirza','zoya.mirza084@gmail.com','9000000084','FEMALE','Information Technology',4],
  [85,'Rehan Ansari','rehan.ansari085@gmail.com','9000000085','MALE','Civil Engineering',1],
  [86,'Sana Parveen','sana.parveen086@gmail.com','9000000086','FEMALE','Electronics Engineering',2],
  [87,'Faizan Ahmed','faizan.ahmed087@gmail.com','9000000087','MALE','Biotechnology',3],
  [88,'Alisha Noor','alisha.noor088@gmail.com','9000000088','FEMALE','Business Administration',4],
  [89,'Kabir Hussain','kabir.hussain089@gmail.com','9000000089','MALE','Mathematics',1],
  [90,'Nida Fatima','nida.fatima090@gmail.com','9000000090','FEMALE','Physics',2],
  [91,'Armaan Khan','armaan.khan091@gmail.com','9000000091','MALE','Computer Science',3],
  [92,'Aarohi Kamat','aarohi.kamat092@gmail.com','9000000092','FEMALE','Electrical Engineering',4],
  [93,'Shivani Patil','shivani.patil093@gmail.com','9000000093','FEMALE','Mechanical Engineering',1],
  [94,'Sanket Jadhav','sanket.jadhav094@gmail.com','9000000094','MALE','Information Technology',2],
  [95,'Vaidehi Joshi','vaidehi.joshi095@gmail.com','9000000095','FEMALE','Civil Engineering',3],
  [96,'Om Deshpande','om.deshpande096@gmail.com','9000000096','MALE','Electronics Engineering',4],
  [97,'Rucha Apte','rucha.apte097@gmail.com','9000000097','FEMALE','Biotechnology',1],
  [98,'Niranjan Borkar','niranjan.borkar098@gmail.com','9000000098','MALE','Business Administration',2],
  [99,'Mrunal Pawar','mrunal.pawar099@gmail.com','9000000099','MALE','Mathematics',3],
  [100,'Siddhi Gokhale','siddhi.gokhale100@gmail.com','9000000100','FEMALE','Physics',4],
  [101,'Abhay Naik','abhay.naik101@gmail.com','9000000101','MALE','Computer Science',1],
  [102,'Pallavi Sawant','pallavi.sawant102@gmail.com','9000000102','FEMALE','Electrical Engineering',2],
  [103,'Ritesh More','ritesh.more103@gmail.com','9000000103','MALE','Mechanical Engineering',3],
  [104,'Kavita Shinde','kavita.shinde104@gmail.com','9000000104','FEMALE','Information Technology',4],
  [105,'Nilesh Kadam','nilesh.kadam105@gmail.com','9000000105','MALE','Civil Engineering',1],
  [106,'Bhakti Joshi','bhakti.joshi106@gmail.com','9000000106','FEMALE','Electronics Engineering',2],
  [107,'Atharv Salunkhe','atharv.salunkhe107@gmail.com','9000000107','MALE','Biotechnology',3],
  [108,'Anushka Desai','anushka.desai108@gmail.com','9000000108','FEMALE','Business Administration',4],
  [109,'Pratiksha Kulkarni','pratiksha.kulkarni109@gmail.com','9000000109','FEMALE','Mathematics',1],
  [110,'Sahil Chavan','sahil.chavan110@gmail.com','9000000110','MALE','Physics',2],
  [111,'Revati Patil','revati.patil111@gmail.com','9000000111','FEMALE','Computer Science',3],
  [112,'Sagar Wagh','sagar.wagh112@gmail.com','9000000112','MALE','Electrical Engineering',4],
  [113,'Sonal Gawde','sonal.gawde113@gmail.com','9000000113','FEMALE','Mechanical Engineering',1],
  [114,'Vishal Koli','vishal.koli114@gmail.com','9000000114','MALE','Information Technology',2],
  [115,'Rashmi Naidu','rashmi.naidu115@gmail.com','9000000115','FEMALE','Civil Engineering',3],
  [116,'Chaitanya Rao','chaitanya.rao116@gmail.com','9000000116','MALE','Electronics Engineering',4],
  [117,'Harini Subramanian','harini.subramanian117@gmail.com','9000000117','FEMALE','Biotechnology',1],
  [118,'Karthik Narayanan','karthik.narayanan118@gmail.com','9000000118','MALE','Business Administration',2],
  [119,'Nithya Krishnan','nithya.krishnan119@gmail.com','9000000119','FEMALE','Mathematics',3],
  [120,'Aravind Srinivasan','aravind.srinivasan120@gmail.com','9000000120','MALE','Physics',4],
  [121,'Keerthana Mohan','keerthana.mohan121@gmail.com','9000000121','FEMALE','Computer Science',1],
  [122,'Vignesh Balaji','vignesh.balaji122@gmail.com','9000000122','MALE','Electrical Engineering',2],
  [123,'Janani Suresh','janani.suresh123@gmail.com','9000000123','FEMALE','Mechanical Engineering',3],
  [124,'Pradeep Nair','pradeep.nair124@gmail.com','9000000124','MALE','Information Technology',4],
  [125,'Aparna Menon','aparna.menon125@gmail.com','9000000125','FEMALE','Civil Engineering',1],
  [126,'Sreeja Pillai','sreeja.pillai126@gmail.com','9000000126','FEMALE','Electronics Engineering',2],
  [127,'Gokul Raj','gokul.raj127@gmail.com','9000000127','MALE','Biotechnology',3],
  [128,'Malavika Menon','malavika.menon128@gmail.com','9000000128','FEMALE','Business Administration',4],
  [129,'Naveena Ramesh','naveena.ramesh129@gmail.com','9000000129','FEMALE','Mathematics',1],
  [130,'Bharath Kumar','bharath.kumar130@gmail.com','9000000130','MALE','Physics',2],
  [131,'Anjali Varma','anjali.varma131@gmail.com','9000000131','FEMALE','Computer Science',3],
  [132,'Rohit Babu','rohit.babu132@gmail.com','9000000132','MALE','Electrical Engineering',4],
  [133,'Divya Lakshmi','divya.lakshmi133@gmail.com','9000000133','FEMALE','Mechanical Engineering',1],
  [134,'Sanjay Raghavan','sanjay.raghavan134@gmail.com','9000000134','MALE','Information Technology',2],
  [135,'Amala Joseph','amala.joseph135@gmail.com','9000000135','FEMALE','Civil Engineering',3],
  [136,'Joseph Mathew','joseph.mathew136@gmail.com','9000000136','MALE','Electronics Engineering',4],
  [137,'Ann Mary Thomas','ann.mary137@gmail.com','9000000137','FEMALE','Biotechnology',1],
  [138,'Kevin Dsouza','kevin.dsouza138@gmail.com','9000000138','MALE','Business Administration',2],
  [139,'Nisha Dsouza','nisha.dsouza139@gmail.com','9000000139','FEMALE','Mathematics',3],
  [140,'Joel Fernandes','joel.fernandes140@gmail.com','9000000140','MALE','Physics',4],
  [141,'Maria Lobo','maria.lobo141@gmail.com','9000000141','FEMALE','Computer Science',1],
  [142,'Neil Dcruz','neil.dcruz142@gmail.com','9000000142','MALE','Electrical Engineering',2],
  [143,'Rhea Pinto','rhea.pinto143@gmail.com','9000000143','FEMALE','Mechanical Engineering',3],
  [144,'Ashwin Kumar','ashwin.kumar144@gmail.com','9000000144','MALE','Information Technology',4],
  [145,'Sowmya Reddy','sowmya.reddy145@gmail.com','9000000145','FEMALE','Civil Engineering',1],
  [146,'Tejaswini Rao','tejaswini.rao146@gmail.com','9000000146','FEMALE','Electronics Engineering',2],
  [147,'Madhav Reddy','madhav.reddy147@gmail.com','9000000147','MALE','Biotechnology',3],
  [148,'Nandita Rao','nandita.rao148@gmail.com','9000000148','FEMALE','Business Administration',4],
  [149,'Pranitha Goud','pranitha.goud149@gmail.com','9000000149','FEMALE','Mathematics',1],
  [150,'Sai Kiran','sai.kiran150@gmail.com','9000000150','MALE','Physics',2],
  [151,'Harsha Vardhan','harsha.vardhan151@gmail.com','9000000151','MALE','Computer Science',3],
  [152,'Srilakshmi Devi','srilakshmi.devi152@gmail.com','9000000152','FEMALE','Electrical Engineering',4],
  [153,'Manoj Naidu','manoj.naidu153@gmail.com','9000000153','MALE','Mechanical Engineering',1],
  [154,'Bhavya Chowdary','bhavya.chowdary154@gmail.com','9000000154','FEMALE','Information Technology',2],
  [155,'Nikhitha Reddy','nikhitha.reddy155@gmail.com','9000000155','FEMALE','Civil Engineering',3],
  [156,'Vamsi Krishna','vamsi.krishna156@gmail.com','9000000156','MALE','Electronics Engineering',4],
  [157,'Anudeep Ganta','anudeep.ganta157@gmail.com','9000000157','MALE','Biotechnology',1],
  [158,'Sravani Koppula','sravani.koppula158@gmail.com','9000000158','FEMALE','Business Administration',2],
  [159,'Pavan Kumar','pavan.kumar159@gmail.com','9000000159','MALE','Mathematics',3],
] as const;

const ROOM_PLAN = [
  { roomNumber: 'A-101', hostel: 'boys', floor: 1, type: 'AC',     beds: 3, price: 12000, amenities: ['AC','Attached Bathroom','Study Table','WiFi']        },
  { roomNumber: 'A-102', hostel: 'boys', floor: 1, type: 'AC',     beds: 3, price: 12000, amenities: ['AC','Attached Bathroom','Study Table','WiFi']        },
  { roomNumber: 'A-201', hostel: 'boys', floor: 2, type: 'NON_AC', beds: 3, price:  7000, amenities: ['Fan','Shared Bathroom','Study Table']                },
  { roomNumber: 'A-202', hostel: 'boys', floor: 2, type: 'NON_AC', beds: 3, price:  7000, amenities: ['Fan','Shared Bathroom','Study Table']                },
  { roomNumber: 'A-301', hostel: 'boys', floor: 3, type: 'AC',     beds: 3, price: 15000, amenities: ['AC','Attached Bathroom','Study Table','Mini Fridge'] },
  { roomNumber: 'A-302', hostel: 'boys', floor: 3, type: 'AC',     beds: 3, price: 15000, amenities: ['AC','Attached Bathroom','Study Table','Mini Fridge'] },
  { roomNumber: 'A-401', hostel: 'boys', floor: 4, type: 'NON_AC', beds: 3, price:  6000, amenities: ['Fan','Shared Bathroom','Study Table']                },
  { roomNumber: 'B-101', hostel: 'girls', floor: 1, type: 'AC',    beds: 3, price: 12000, amenities: ['AC','Attached Bathroom','Wardrobe','WiFi']           },
  { roomNumber: 'B-102', hostel: 'girls', floor: 1, type: 'AC',    beds: 3, price: 12000, amenities: ['AC','Attached Bathroom','Wardrobe','WiFi']           },
  { roomNumber: 'B-201', hostel: 'girls', floor: 2, type: 'NON_AC',beds: 3, price:  7000, amenities: ['Fan','Shared Bathroom','Wardrobe']                   },
  { roomNumber: 'B-202', hostel: 'girls', floor: 2, type: 'NON_AC',beds: 3, price:  7000, amenities: ['Fan','Shared Bathroom','Wardrobe']                   },
  { roomNumber: 'B-301', hostel: 'girls', floor: 3, type: 'AC',    beds: 3, price: 15000, amenities: ['AC','Attached Bathroom','Wardrobe','Study Table']    },
  { roomNumber: 'B-302', hostel: 'girls', floor: 3, type: 'AC',    beds: 3, price: 15000, amenities: ['AC','Attached Bathroom','Wardrobe','Study Table']    },
  { roomNumber: 'B-401', hostel: 'girls', floor: 4, type: 'NON_AC',beds: 3, price:  6000, amenities: ['Fan','Shared Bathroom','Wardrobe']                   },
] as const;

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 600): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, delay * attempt));
    }
  }
  throw new Error('Retry failed');
}

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminHash = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@hostel.edu' },
    update: {},
    create: { email: 'admin@hostel.edu', passwordHash: adminHash, fullName: 'System Administrator' },
  });
  console.log('✅ Admin:', admin.email);

  const boysTotalRooms = ROOM_PLAN.filter(r => r.hostel === 'boys').length;
  const girlsTotalRooms = ROOM_PLAN.filter(r => r.hostel === 'girls').length;

  const hostel1 = await prisma.hostel.upsert({
    where: { name: 'Sunrise Boys Hostel' },
    update: { totalRooms: boysTotalRooms },
    create: {
      name: 'Sunrise Boys Hostel', description: 'Premium hostel for male students with modern amenities.',
      gender: 'MALE', address: 'Block A, North Campus, University Road',
      amenities: ['WiFi', 'Gym', 'Cafeteria', 'Laundry', 'CCTV'],
      totalRooms: boysTotalRooms, availableRooms: boysTotalRooms,
    },
  });
  const hostel2 = await prisma.hostel.upsert({
    where: { name: 'Moonrise Girls Hostel' },
    update: { totalRooms: girlsTotalRooms },
    create: {
      name: 'Moonrise Girls Hostel', description: 'Safe and comfortable hostel for female students.',
      gender: 'FEMALE', address: 'Block B, South Campus, University Road',
      amenities: ['WiFi', 'Common Room', 'Cafeteria', 'Laundry', 'Security Guard'],
      totalRooms: girlsTotalRooms, availableRooms: girlsTotalRooms,
    },
  });
  console.log('✅ Hostels created');

  for (const rp of ROOM_PLAN) {
    const hostelId = rp.hostel === 'boys' ? hostel1.id : hostel2.id;
    await prisma.room.upsert({
      where: { hostelId_roomNumber: { hostelId, roomNumber: rp.roomNumber } },
      update: { totalBeds: rp.beds, occupiedBeds: 0, status: 'AVAILABLE' },
      create: {
        hostelId, roomNumber: rp.roomNumber, floor: rp.floor,
        roomType: rp.type as 'AC' | 'NON_AC', totalBeds: rp.beds,
        occupiedBeds: 0, status: 'AVAILABLE',
        pricePerMonth: rp.price, amenities: [...rp.amenities],
      },
    });
  }
  console.log('✅ Rooms created');

  const studentHash = await bcrypt.hash('Student@123', 12);
  const studentMap = new Map<number, string>();

  // Ensure demo student shown on login screen exists
  await prisma.student.upsert({
    where: { email: 'sanchit@student.edu' },
    update: { passwordHash: studentHash },
    create: {
      email: 'sanchit@student.edu',
      passwordHash: studentHash,
      fullName: 'Sanchit Upneja',
      studentId: 'STU0000000',
      phone: '9876543210',
      gender: 'MALE',
      course: 'Computer Science',
      yearOfStudy: 4,
    },
  });

  for (const [id, fullName, email, phone, gender, course, yearOfStudy] of RAW_STUDENTS) {
    const studentId = `STU${String(id).padStart(7, '0')}`;
    const s = await withRetry(async () => {
      await prisma.student.deleteMany({ where: { studentId, NOT: { email: email as string } } });
      return await prisma.student.upsert({
        where: { email: email as string },
        update: { fullName: fullName as string, phone: phone as string, gender: gender as 'MALE'|'FEMALE', course: course as string, yearOfStudy: yearOfStudy as number },
        create: { email: email as string, passwordHash: studentHash, fullName: fullName as string, studentId, phone: phone as string, gender: gender as 'MALE'|'FEMALE', course: course as string, yearOfStudy: yearOfStudy as number },
      });
    });
    studentMap.set(id as number, s.id);
  }
  console.log(`✅ Students upserted: ${studentMap.size}`);

  // Assign every student to a gender-matched room (3 students per room).
  const allocationSummary = await seedAllocations(prisma, {
    adminId: admin.id,
    academicYear: DEFAULT_ACADEMIC_YEAR,
    semester: 1,
  });

  console.log('\n🎉 Seeding complete!');
  console.log(
    `  Students: ${allocationSummary.totalStudents} | Allocated: ${allocationSummary.allocated} | Unassigned: ${allocationSummary.unassigned}`
  );
  console.log('  Admin   → admin@hostel.edu / Admin@123');
  console.log('  Student → aarav.sharma001@gmail.com / Student@123');
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
