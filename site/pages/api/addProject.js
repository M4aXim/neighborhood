import Airtable from "airtable";

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, projectName, githubLink } = req.body;

  if (!token || !projectName) {
    return res.status(400).json({ message: "Token and project name are required" });
  }

  try {
    // First, find the user by token
    const userRecords = await base(process.env.AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRecord = userRecords[0];

    // Check if project already exists
    const existingProjects = await base("hackatimeProjects")
      .select({
        filterByFormula: `{name} = '${projectName}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (existingProjects.length > 0) {
      // Project exists, check if it's already attributed to this user
      const existingProject = existingProjects[0];
      const currentNeighbors = existingProject.fields.neighbor || [];
      
      if (currentNeighbors.includes(userRecord.id)) {
        // User already has this project attributed
        return res.status(200).json({
          message: "Project already attributed to user",
          project: existingProject,
        });
      }

      // Add this user to the project's neighbors
      await base("hackatimeProjects").update(existingProject.id, {
        neighbor: [...currentNeighbors, userRecord.id],
      });

      return res.status(200).json({
        message: "Project updated successfully",
        project: existingProject,
      });
    }

    // Add new project to hackatimeProjects table
    const projectRecord = await base("hackatimeProjects").create([
      {
        fields: {
          name: projectName,
          githubLink: githubLink || "",
          neighbor: [userRecord.id], // Link to neighbor record
          email: userRecord.fields.email, // Add email for tracking
        },
      },
    ]);

    return res.status(200).json({
      message: "Project added successfully",
      project: projectRecord[0],
    });
  } catch (error) {
    console.error("Airtable Error:", error);
    return res.status(500).json({
      message: "Error adding project",
      error: error.message,
    });
  }
}
