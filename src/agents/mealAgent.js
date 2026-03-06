const normalize = (value = '') => String(value || '').toLowerCase();

const extractKeywords = (text = '') => {
  const cuisineMap = {
    italian: ['italian', 'pasta'],
    mexican: ['mexican', 'taco', 'burrito'],
    asian: ['asian', 'stir fry', 'rice bowl'],
    comfort: ['comfort', 'cozy', 'hearty'],
    healthy: ['healthy', 'light', 'clean'],
  };

  return Object.entries(cuisineMap)
    .filter(([, aliases]) => aliases.some((alias) => text.includes(alias)))
    .map(([key]) => key);
};

export const mealAgent = {
  id: 'meal',
  title: 'Meal Agent',
  execute(input = {}, context = {}) {
    const inventory = input.inventory || [];
    const mealHistory = input.mealHistory || [];
    const familySize = Number(input.familySize || 4);
    const prompt = normalize(input.prompt);

    const inventoryTerms = inventory.map((item) => normalize(item.name || item));
    const cuisines = extractKeywords(prompt);

    const recipeCatalog = [
      { id: 'meal-1', name: 'Sheet Pan Chicken & Veggies', ingredients: ['chicken', 'broccoli', 'carrots', 'olive oil'], prepMinutes: 30, cuisine: 'healthy' },
      { id: 'meal-2', name: 'One-Pot Taco Rice', ingredients: ['ground beef', 'rice', 'black beans', 'tomato'], prepMinutes: 25, cuisine: 'mexican' },
      { id: 'meal-3', name: 'Creamy Tomato Pasta', ingredients: ['pasta', 'tomato', 'cream', 'parmesan'], prepMinutes: 20, cuisine: 'italian' },
      { id: 'meal-4', name: 'Veggie Fried Rice', ingredients: ['rice', 'eggs', 'peas', 'carrots', 'soy sauce'], prepMinutes: 18, cuisine: 'asian' },
      { id: 'meal-5', name: 'Turkey Chili', ingredients: ['ground turkey', 'beans', 'tomato', 'onion'], prepMinutes: 35, cuisine: 'comfort' },
    ];

    const recentlyUsed = new Set(mealHistory.slice(-5).map((meal) => normalize(meal.name || meal.meal || '')));

    const scored = recipeCatalog
      .filter((recipe) => !recentlyUsed.has(normalize(recipe.name)))
      .map((recipe) => {
        const matchedIngredients = recipe.ingredients.filter((ingredient) =>
          inventoryTerms.some((term) => term.includes(ingredient) || ingredient.includes(term)),
        );
        const cuisineBoost = cuisines.length === 0 || cuisines.includes(recipe.cuisine) ? 0.2 : 0;
        const ingredientCoverage = matchedIngredients.length / recipe.ingredients.length;
        const score = Math.min(0.99, Number((ingredientCoverage * 0.75 + cuisineBoost + 0.05).toFixed(2)));
        const missingIngredients = recipe.ingredients.filter((ingredient) => !matchedIngredients.includes(ingredient));

        return {
          recipe,
          matchedIngredients,
          missingIngredients,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const suggestions = scored.map(({ recipe, matchedIngredients, missingIngredients, score }) => ({
      id: `meal-suggestion-${recipe.id}`,
      type: 'meal_plan',
      title: `${recipe.name} for ${familySize} people`,
      payload: {
        mealName: recipe.name,
        servings: familySize,
        prepMinutes: recipe.prepMinutes,
        matchedIngredients,
        missingIngredients,
      },
      confidence: score,
    }));

    return {
      agent: 'meal',
      summary: suggestions.length
        ? `Generated ${suggestions.length} optimized meal suggestions using your pantry.`
        : 'No meal suggestions available. Add more ingredients to inventory.',
      suggestions,
      metadata: {
        inventoryCount: inventory.length,
        cuisines,
        generatedAt: Date.now(),
      },
      context,
    };
  },
};
