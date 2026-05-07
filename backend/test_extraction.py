import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

import re
from tasks.document_tasks import rule_based_extract

def test_strawberry_ice_cream():
    text = """Strawberry Ice Cream
Recipe from Ben & Jerry’s Homemade Ice Cream & Dessert Book
Ben Cohen, Jerry Greenfield, Nancy J. Steven, Workman Publishing 1987

Sweet Cream Base
2 large eggs
¾ cup of sugar
2 cups heavy or whipping cream
1 cup milk

Whisk the eggs in a mixing bowl until light and fluffy, 1 to 2 minutes. Whisk in the
sugar, a little at a time, then continue whisking until completely blended, about one
minute more. Pour in the cream and milk and whisk to blend. (Makes 1 Quart)

Strawberry Addition
1 pint of fresh strawberries hulled and sliced
1/3 cup of sugar
Juice of ½ a lemon
Sweet cream base (above)

1. Combine strawberries, sugar, and lemon juice in a mixing bowl. Cover and
refrigerate at least one hour.
2. Mash the strawberries to a puree and stir into the sweet cream base.
3. Transfer the mixture to an ice cream maker and freeze following the
manufacturer’s instructions.
Enjoy!"""

    result = rule_based_extract(text)
    
    print(f"Title: {result['title']}")
    print("\nIngredients:")
    print(result['ingredients'])
    
    print("\nSteps:")
    print(result['steps'])
    
    # Assertions
    ingredients = [l for l in result['ingredients'].split('\n') if l.strip()]
    steps = [l for l in result['steps'].split('\n') if l.strip()]
    
    assert len(ingredients) > 0, "No ingredients found!"
    assert len(steps) > 0, "No steps found!"
    assert "Sweet Cream Base:" in result['ingredients'], "Sub-header missing"
    assert "2 large eggs" in result['ingredients'], "Ingredient missing"
    
    print("\n✓ Test Passed!")

def test_fragmented_strawberry():
    text = """Sweet Cream Base
eggs
2 large
of sugar
¾ cup
heavy or whipping cream
2 cups
milk
1 cup

Whisk the eggs in a mixing bowl until light and fluffy, 1 to 2 minutes. Whisk in the
sugar, a little at a time, then continue whisking until completely blended, about one
minute more. Pour in the cream and milk and whisk to blend. (Makes 1 Quart)

Strawberry Addition
pint of fresh strawberries hulled and sliced
1
of sugar
1/3 cup
Juice of ½ a lemon
Sweet cream base (above)

Instructions
1
refrigerate at least one hour."""

    result = rule_based_extract(text)
    
    print(f"Title: {result['title']}")
    print("\nIngredients:")
    print(result['ingredients'])
    
    print("\nSteps:")
    print(result['steps'])
    
    # Assertions
    ingredients = [l for l in result['ingredients'].split('\n') if l.strip()]
    steps = [l for l in result['steps'].split('\n') if l.strip()]
    
    assert len(ingredients) > 0, "No ingredients found!"
    assert any("2 large eggs" in line.lower() or ("eggs" in line.lower() and "2 large" in line.lower()) for line in ingredients), "Fragmented ingredient pairing failed"
    assert any("refrigerate" in line.lower() for line in steps), "Fragmented instruction failed"
    
    print("\n✓ Fragmented Test Passed!")

def test_super_fragmented_strawberry():
    text = """Ingredients
Sweet Cream Base
eggs ¾ cup of sugar
2 large
heavy or whipping cream
2 cups
Strawberry Addition
pint of fresh strawberries hulled and sliced 1/3 cup of sugar
1
Juice of ½ a lemon Sweet cream base (above)
Instructions
1
Whisk the eggs in a mixing bowl until light and fluffy, 1 to 2 minutes. Whisk in the

2
sugar, a little at a time, then continue whisking until completely blended, about one

3
minute more. Pour in the cream and milk and whisk to blend. (Makes 1 Quart)

4
Enjoy!"""

    result = rule_based_extract(text)
    
    print(f"Title: {result['title']}")
    print("\nIngredients:")
    print(result['ingredients'])
    
    print("\nSteps:")
    print(result['steps'])
    
    # Assertions
    ingredients = [l for l in result['ingredients'].split('\n') if l.strip()]
    steps = [l for l in result['steps'].split('\n') if l.strip()]
    
    assert len(ingredients) > 0, "No ingredients found!"
    # eggs ¾ cup of sugar 2 large should be paired
    assert any("eggs" in line.lower() and "2 large" in line.lower() for line in ingredients), "Failed to pair 'eggs' with '2 large'"
    assert any("sugar" in line.lower() and "¾ cup" in line.lower() for line in ingredients), "Failed to split and pair '¾ cup of sugar'"
    
    # Steps should be joined until period
    assert any("Whisk the eggs... (Makes 1 Quart)" in line or "Whisk the eggs" in line and "(Makes 1 Quart)" in line for line in steps), "Sentences not merged correctly"
    
    print("\n✓ Super Fragmented Test Passed!")

if __name__ == "__main__":
    print("-" * 40)
    test_strawberry_ice_cream()
    print("-" * 40)
    test_fragmented_strawberry()
    print("-" * 40)
    test_super_fragmented_strawberry()
    print("-" * 40)
