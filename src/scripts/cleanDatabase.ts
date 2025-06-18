import { prisma } from '../services/database.service';

async function checkAndCleanDatabase() {
  try {
    console.log('🔍 Sprawdzanie stanu bazy danych...\n');

    // Sprawdź użytkowników
    const users = await prisma.user.findMany({
      include: {
        subscriptions: true,
        sessions: true,
      }
    });

    console.log(`👥 Znaleziono ${users.length} użytkowników:`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - Role: ${user.role}`);
      console.log(`    Subskrypcje: ${user.subscriptions.length}`);
      console.log(`    Sesje: ${user.sessions.length}`);
    });

    // Sprawdź subskrypcje
    const subscriptions = await prisma.subscription.findMany();
    console.log(`\n💎 Znaleziono ${subscriptions.length} subskrypcji:`);
    subscriptions.forEach(sub => {
      console.log(`  - ID: ${sub.id}, Type: ${sub.type}, Status: ${sub.status}, Active: ${sub.isActive}`);
    });

    // Wyczyść wszystkie aktywne subskrypcje
    console.log('\n🧹 Czyszczenie aktywnych subskrypcji...');
    const deletedSubs = await prisma.subscription.deleteMany({
      where: {
        OR: [
          { isActive: true },
          { status: 'ACTIVE' },
          { status: 'TRIAL' }
        ]
      }
    });
    console.log(`Usunięto ${deletedSubs.count} aktywnych subskrypcji`);

    // Utwórz domyślne subskrypcje FREE dla wszystkich użytkowników
    console.log('\n✨ Tworzenie domyślnych subskrypcji FREE...');
    
    for (const user of users) {
      const defaultSubscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          type: 'FREE',
          status: 'ACTIVE',
          isActive: true,
          currency: 'PLN',
          startDate: new Date(),
        }
      });
      console.log(`Utworzono domyślną subskrypcję FREE dla użytkownika: ${user.username}`);
    }

    // Sprawdź wynik
    const finalSubscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    console.log('\n📊 Stan końcowy subskrypcji:');
    finalSubscriptions.forEach(sub => {
      console.log(`  - ${sub.user.username}: ${sub.type} (${sub.status}) - Active: ${sub.isActive}`);
    });

    console.log('\n✅ Operacja zakończona pomyślnie!');

  } catch (error) {
    console.error('❌ Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Uruchom skrypt
checkAndCleanDatabase();
