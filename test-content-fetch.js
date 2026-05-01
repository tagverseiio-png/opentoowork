// Test script to check what's in the database
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "http://localhost:54321",
  process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNjQwOTU1MjIyfQ.CRXP3sSgf1jUPAh9hnr2j7CKkuoUvnrt3snVmWEYeTQ"
);

async function testFetch() {
  try {
    console.log("Fetching all site_content...");
    const { data, error } = await supabase
      .from("site_content")
      .select("section_key, content");

    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Raw data returned:", JSON.stringify(data, null, 2));
      
      if (data) {
        const whyChooseUs = data.find(item => item.section_key === "homepage_why_choose_us");
        console.log("\nhomepage_why_choose_us specifically:", JSON.stringify(whyChooseUs, null, 2));
        
        if (whyChooseUs?.content) {
          console.log("Items array:", whyChooseUs.content.items);
          console.log("Is items an array?", Array.isArray(whyChooseUs.content.items));
          console.log("Items length:", whyChooseUs.content.items?.length);
        }
      }
    }
  } catch (error) {
    console.error("Exception:", error);
  }
}

testFetch();
