#!/usr/bin/env tsx

/**
 * TOTL Agency Signup Flow Test Script
 *
 * This script tests the signup flow with various metadata scenarios
 * to ensure the database trigger handles all edge cases correctly.
 *
 * Usage: npx tsx scripts/test-signup-flow.ts
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Test scenarios with different metadata configurations
const testScenarios = [
  {
    name: "Complete Talent Signup",
    metadata: {
      first_name: "John",
      last_name: "Doe",
      role: "talent",
    },
    expected: {
      profile_role: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "John",
      last_name: "Doe",
    },
  },
  {
    name: "Complete Client Signup",
    metadata: {
      first_name: "Jane",
      last_name: "Client",
      role: "client",
      company_name: "Acme Corporation",
    },
    expected: {
      profile_role: "client",
      talent_profile_exists: false,
      client_profile_exists: true,
      company_name: "Acme Corporation",
    },
  },
  {
    name: "Talent with Missing Names",
    metadata: {
      role: "talent",
    },
    expected: {
      profile_role: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "",
      last_name: "",
    },
  },
  {
    name: "Client with Missing Company",
    metadata: {
      first_name: "Bob",
      last_name: "Business",
      role: "client",
    },
    expected: {
      profile_role: "client",
      talent_profile_exists: false,
      client_profile_exists: true,
      company_name: "Bob Business", // Should default to display_name
    },
  },
  {
    name: "Empty Metadata",
    metadata: {},
    expected: {
      profile_role: "talent", // Default role
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "",
      last_name: "",
    },
  },
  {
    name: "Wrong Metadata Keys (camelCase)",
    metadata: {
      firstName: "Wrong",
      lastName: "Keys",
      Role: "talent",
    },
    expected: {
      profile_role: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "", // Should be empty due to wrong key names
      last_name: "",
    },
  },
];

async function testSignupFlow() {
  console.log("🧪 Starting TOTL Agency Signup Flow Tests\n");

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables");
    console.log("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let passedTests = 0;
  const totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    console.log(`📋 Testing: ${scenario.name}`);

    try {
      // Generate unique test email
      const testEmail = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      const testPassword = "TestPassword123!";

      // Create test user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: scenario.metadata,
        },
      });

      if (authError) {
        console.log(`  ❌ Auth Error: ${authError.message}`);
        continue;
      }

      if (!authData.user) {
        console.log(`  ❌ No user created`);
        continue;
      }

      const userId = authData.user.id;

      // Wait a moment for trigger to execute
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check profile creation
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        console.log(`  ❌ Profile Error: ${profileError.message}`);
        continue;
      }

      // Check talent profile
      const { data: talentProfile } = await supabase
        .from("talent_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Check client profile
      const { data: clientProfile } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Validate results
      let testPassed = true;
      const results = [];

      // Check profile role
      if (profile.role !== scenario.expected.profile_role) {
        results.push(`❌ Expected role '${scenario.expected.profile_role}', got '${profile.role}'`);
        testPassed = false;
      } else {
        results.push(`✅ Role: ${profile.role}`);
      }

      // Check talent profile existence
      if (scenario.expected.talent_profile_exists && !talentProfile) {
        results.push("❌ Expected talent profile, but not found");
        testPassed = false;
      } else if (!scenario.expected.talent_profile_exists && talentProfile) {
        results.push("❌ Unexpected talent profile found");
        testPassed = false;
      } else {
        results.push(
          `✅ Talent profile: ${scenario.expected.talent_profile_exists ? "exists" : "not found"}`
        );
      }

      // Check client profile existence
      if (scenario.expected.client_profile_exists && !clientProfile) {
        results.push("❌ Expected client profile, but not found");
        testPassed = false;
      } else if (!scenario.expected.client_profile_exists && clientProfile) {
        results.push("❌ Unexpected client profile found");
        testPassed = false;
      } else {
        results.push(
          `✅ Client profile: ${scenario.expected.client_profile_exists ? "exists" : "not found"}`
        );
      }

      // Check specific fields for talent profiles
      if (talentProfile) {
        if (
          scenario.expected.first_name !== undefined &&
          talentProfile.first_name !== scenario.expected.first_name
        ) {
          results.push(
            `❌ Expected first_name '${scenario.expected.first_name}', got '${talentProfile.first_name}'`
          );
          testPassed = false;
        } else {
          results.push(`✅ First name: ${talentProfile.first_name}`);
        }

        if (
          scenario.expected.last_name !== undefined &&
          talentProfile.last_name !== scenario.expected.last_name
        ) {
          results.push(
            `❌ Expected last_name '${scenario.expected.last_name}', got '${talentProfile.last_name}'`
          );
          testPassed = false;
        } else {
          results.push(`✅ Last name: ${talentProfile.last_name}`);
        }
      }

      // Check specific fields for client profiles
      if (clientProfile) {
        if (
          scenario.expected.company_name !== undefined &&
          clientProfile.company_name !== scenario.expected.company_name
        ) {
          results.push(
            `❌ Expected company_name '${scenario.expected.company_name}', got '${clientProfile.company_name}'`
          );
          testPassed = false;
        } else {
          results.push(`✅ Company name: ${clientProfile.company_name}`);
        }
      }

      // Display results
      results.forEach((result) => console.log(`    ${result}`));

      if (testPassed) {
        console.log(`  ✅ PASSED\n`);
        passedTests++;
      } else {
        console.log(`  ❌ FAILED\n`);
      }

      // Clean up test user
      await cleanupTestUser(supabase, userId);
    } catch (error) {
      console.log(`  ❌ Test Error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
    }
  }

  // Summary
  console.log("📊 Test Summary");
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed! Signup flow is working correctly.");
  } else {
    console.log("\n⚠️  Some tests failed. Please review the results above.");
  }
}

async function cleanupTestUser(supabase: SupabaseClient, userId: string) {
  try {
    // Delete role-specific profiles
    await supabase.from("talent_profiles").delete().eq("user_id", userId);
    await supabase.from("client_profiles").delete().eq("user_id", userId);

    // Delete main profile
    await supabase.from("profiles").delete().eq("id", userId);

    // Note: auth.users deletion requires admin privileges
    // In production, you might want to mark users as deleted instead
  } catch {
    console.log(`Warning: Could not clean up test user ${userId}`);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testSignupFlow().catch(console.error);
}

export { testSignupFlow };
