// Use native fetch

async function run() {
  const base = 'http://localhost:7887';
  const email = `test${Date.now()}@example.com`;

  try {
    // Register
    await fetch(`${base}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', email, password: 'Password123!' })
    });
    
    // Login
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'Password123!' })
    });
    const { token } = await loginRes.json();
    console.log("Token acquired.");

    // Create Project
    const projRes = await fetch(`${base}/api/projects`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Proj1', location: 'Loc1', description: 'Desc1' })
    });
    const proj = await projRes.json();
    console.log("Project created with ID:", proj.id);

    // Create Bill
    const reqBody = {
      billDate: '2023-10-10',
      items: [
        { itemName: 'Cement', expenseDate: '2023-10-10', amount: 500, sortOrder: 1 }
      ]
    };

    console.log("Creating bill...");
    const billRes = await fetch(`${base}/api/projects/${proj.id}/bills`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    });
    
    const status = billRes.status;
    const body = await billRes.text();
    console.log("Bill API Status:", status);
    console.log("Bill API Response:", body);

  } catch (e) {
    console.error(e);
  }
}
run();
