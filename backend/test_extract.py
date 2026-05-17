import sys
sys.path.append('c:/project/backend')
from tasks.document_tasks import rule_based_extract

text = """Simple, easy and delicious. This recipe has instructions for both air-frying and oven baking. Crisp on
the outside and tender on the inside, Air-Fryer French Fries make a great side dish or snack.
Mix things up by using different potatoes and seasonings. Russets will give you a fluffier inside due
to their low-moisture content, while reds will have a delicate sweetness and creamy texture. Have fun!
VT Fresh is funded in part by the USDA’s Supplemental Nutrition Assistance Program (SNAP). USDA is an equal opportunity provider and employer.
Enter to win a $100 gift card! Visit vtfoodbank.org/vtfresh for info on testing recipes and more!
Ingredients Steps
 4 medium potatoes
 2 Tbsp vegetable oil
 salt & pepper, to taste
1. Preheat air-fryer to 400°F or oven to 425°.
2. Wash potatoes well and pat dry.
3. To make a French fry cut slice potatoes length wise to create 1/2-inch planks.
Lay planks flat and cut into 1/2-inch strips. Rinse, drain thoroughly and pat dry.
4. In medium bowl toss potato strips in vegetable oil, season with salt & pepper.
5. Dump potato strips into air-fryer basket. For oven, spread strips of potatoes
onto baking sheet in a single layer, do not overcrowd.
6. Air-fry for 25 minutes, toss potatoes every 5 minutes to evenly brown potatoes.
Potatoes will be golden brown and tender when done. For oven, bake for 35-40
minutes, turn frequently for even browning."""

result = rule_based_extract(text)
print("INGREDIENTS:")
print(result["ingredients"])
print("STEPS:")
print(result["steps"])
