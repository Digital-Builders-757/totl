#!/usr/bin/env tsx

/* eslint-disable @typescript-eslint/no-unused-vars */

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
      account_type: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "John",
      last_name: "Doe",
    },
  },
  {
    name: "Metadata Role Client (should still bootstrap as Talent)",
    metadata: {
      first_name: "Jane",
      last_name: "Client",
      // Attempted escalation (should be ignored by trigger)
      role: "client",
      company_name: "Acme Corporation",
    },
    expected: {
      profile_role: "talent",
      account_type: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
    },
  },
  {
    name: "Talent with Missing Names",
    metadata: {
      role: "talent",
    },
    expected: {
      profile_role: "talent",
      account_type: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "",
      last_name: "",
    },
  },
  {
    name: "Metadata Role Client with Missing Company (should still bootstrap as Talent)",
    metadata: {
      first_name: "Bob",
      last_name: "Business",
      // Attempted escalation (should be ignored by trigger)
      role: "client",
    },
    expected: {
      profile_role: "talent",
      account_type: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
    },
  },
  {
    name: "Empty Metadata",
    metadata: {},
    expected: {
      profile_role: "talent", // Default role
      account_type: "talent",
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
      profile_role: "talent", // Default role since wrong keys
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "", // Empty because wrong key name
      last_name: "", // Empty because wrong key name
    },
  },
  {
    name: "Metadata Role Admin (should still bootstrap as Talent)",
    metadata: {
      first_name: "Admin",
      last_name: "User",
      role: "admin",
    },
    expected: {
      profile_role: "talent",
      account_type: "talent",
      talent_profile_exists: true,
      client_profile_exists: false,
      first_name: "Admin",
      last_name: "User",
    },
  },
];

// Regression test for schema reference issues
const regressionTests = [
  {
    name: "Schema Reference Regression Test",
    description: "Tests that explicit schema references work under different conditions",
    test: async (supabase: SupabaseClient) => {
      console.log("🔍 Running schema reference regression test...");

      // Test 1: Verify enum exists and can be cast
      const { data: enumTest, error: enumError } = await supabase.rpc("test_enum_casting", {
        test_role: "talent",
      });

      if (enumError) {
        console.error("❌ Enum casting test failed:", enumError);
        return false;
      }

      console.log("✅ Enum casting test passed");

      // Test 2: Verify trigger function exists
      const { data: triggerTest, error: triggerError } = await supabase.rpc(
        "test_trigger_function_exists"
      );

      if (triggerError) {
        console.error("❌ Trigger function test failed:", triggerError);
        return false;
      }

      console.log("✅ Trigger function test passed");

      return true;
    },
  },
];

async function runTestScenario(
  supabase: SupabaseClient,
  scenario: (typeof testScenarios)[0],
  testIndex: number
): Promise<boolean> {
  const testEmail = `test-${testIndex}-${Date.now()}@example.com`;
  const testPassword = "TestPassword123!";

  console.log(`\n🧪 Testing: ${scenario.name}`);
  console.log(`📧 Test email: ${testEmail}`);

  try {
    // Step 1: Create user with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: scenario.metadata,
      },
    });

    if (authError) {
      console.error("❌ Auth signup failed:", authError.message);
      return false;
    }

    if (!authData.user) {
      console.error("❌ No user returned from signup");
      return false;
    }

    console.log("✅ User created successfully");

    // Step 2: Wait a moment for trigger to execute
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Step 3: Check profile creation
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, account_type")
      .eq("id", authData.user.id)
      .single();

    if (profileError) {
      console.error("❌ Profile not found:", profileError.message);
      return false;
    }

    console.log("✅ Profile created successfully");

    // Step 4: Verify profile data
    if (profile.role !== scenario.expected.profile_role) {
      console.error(
        `❌ Wrong role: expected ${scenario.expected.profile_role}, got ${profile.role}`
      );
      return false;
    }

    // Step 4b: Verify account_type (PR #3 contract)
    if ("account_type" in scenario.expected && profile.account_type !== scenario.expected.account_type) {
      console.error(
        `❌ Wrong account_type: expected ${scenario.expected.account_type}, got ${profile.account_type}`
      );
      return false;
    }

    // Step 5: Check role-specific profile
    if (scenario.expected.talent_profile_exists) {
      const { data: talentProfile, error: talentError } = await supabase
        .from("talent_profiles")
        .select("user_id, first_name, last_name")
        .eq("user_id", authData.user.id)
        .single();

      if (talentError) {
        console.error("❌ Talent profile not found:", talentError.message);
        return false;
      }

      // Verify talent profile data
      if (talentProfile.first_name !== scenario.expected.first_name) {
        console.error(
          `❌ Wrong first_name: expected "${scenario.expected.first_name}", got "${talentProfile.first_name}"`
        );
        return false;
      }

      if (talentProfile.last_name !== scenario.expected.last_name) {
        console.error(
          `❌ Wrong last_name: expected "${scenario.expected.last_name}", got "${talentProfile.last_name}"`
        );
        return false;
      }

      console.log("✅ Talent profile verified");
    }

    if (scenario.expected.client_profile_exists) {
      const { data: clientProfile, error: clientError } = await supabase
        .from("client_profiles")
        .select("user_id, company_name")
        .eq("user_id", authData.user.id)
        .single();

      if (clientError) {
        console.error("❌ Client profile not found:", clientError.message);
        return false;
      }

      // Verify client profile data
      if ("company_name" in scenario.expected) {
        const expectedCompanyName = scenario.expected.company_name;
        if (expectedCompanyName && clientProfile.company_name !== expectedCompanyName) {
          console.error(
            `❌ Wrong company_name: expected "${expectedCompanyName}", got "${clientProfile.company_name}"`
          );
          return false;
        }
      }

      console.log("✅ Client profile verified");
    }

    // Step 6: Clean up test user
    await cleanupTestUser(supabase, authData.user.id);

    console.log("✅ Test scenario passed");
    return true;
  } catch (error) {
    console.error("❌ Test scenario failed with error:", error);
    return false;
  }
}

async function cleanupTestUser(supabase: SupabaseClient, userId: string) {
  try {
    // Delete role-specific profiles first
    await supabase.from("talent_profiles").delete().eq("user_id", userId);
    await supabase.from("client_profiles").delete().eq("user_id", userId);

    // Delete main profile
    await supabase.from("profiles").delete().eq("id", userId);

    // Delete auth user (requires admin privileges)
    // Note: This might not work in all environments
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (error) {
      console.log("⚠️ Could not delete auth user (requires admin privileges)");
    }
  } catch (error) {
    console.error("⚠️ Cleanup failed:", error);
  }
}

async function runRegressionTests(supabase: SupabaseClient): Promise<boolean> {
  console.log("\n🔧 Running regression tests...");

  let allPassed = true;

  for (const test of regressionTests) {
    console.log(`\n🧪 ${test.name}: ${test.description}`);

    const passed = await test.test(supabase);
    if (!passed) {
      allPassed = false;
    }
  }

  return allPassed;
}

async function main() {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Missing Supabase environment variables");
    console.error("Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("🚀 Starting TOTL Agency Signup Flow Tests");
  console.log("==========================================");

  // Run regression tests first
  const regressionPassed = await runRegressionTests(supabase);
  if (!regressionPassed) {
    console.error("❌ Regression tests failed. Stopping.");
    process.exit(1);
  }

  // Run main test scenarios
  let passedTests = 0;
  const totalTests = testScenarios.length;

  for (let i = 0; i < testScenarios.length; i++) {
    const passed = await runTestScenario(supabase, testScenarios[i], i);
    if (passed) {
      passedTests++;
    }
  }

  // Summary
  console.log("\n📊 Test Summary");
  console.log("===============");
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log("\n🎉 All tests passed! Signup flow is working correctly.");
    process.exit(0);
  } else {
    console.log("\n💥 Some tests failed. Please check the errors above.");
    process.exit(1);
  }
}

// Run the tests
main().catch((error) => {
  console.error("❌ Test runner failed:", error);
  process.exit(1);
});
