const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function getRecipes() {
  const response = await fetch(`${API_BASE_URL}/api/recipes`, { cache: "no-store" });
  if (!response.ok) return [];
  return response.json();
}

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <main>
      <h2 className="page-title">Recipes</h2>
      <p className="subtle">Bill of materials per product and version.</p>
      <section className="section list-grid">
        {recipes.map((recipe) => (
          <article className="list-card" key={recipe.id}>
            <p><strong>{recipe.productName}</strong> - v{recipe.version} - Yield {recipe.yieldQty}</p>
            <p className="meta">
              {recipe.items.map((i) => `${i.ingredientName} ${Number(i.qty).toFixed(2)} ${i.unit}`).join(" - ") || "No items"}
            </p>
          </article>
        ))}
        {recipes.length === 0 ? <p className="subtle">No recipes yet.</p> : null}
      </section>
    </main>
  );
}
