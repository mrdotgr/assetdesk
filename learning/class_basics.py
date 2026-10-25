

class Asset:
    def __init__(self, name, category, status="available"):
    # Store the name and category supplied by the caller.
        self.name = name
        self.category = category

    # Use the supplied status, or the default when it is omitted.
        self.status = status

    def change_status(self, new_status):
        # Update the instance receiving this method call.
        self.status = new_status

    def get_status(self):
        # Give the caller this instance's current status.
        return self.status


# BEFORE: create one instance and read its starting status.
# Supply a name, a category and an initial status.
printer = Asset("Demo printer", "printer", "assigned")
earlier_status = printer.get_status()

keyboard = Asset("Demo keyboard", "keyboard", "available")

# CHANGE: update the existing printer instance.
printer.change_status("assigned")

# AFTER: read its status again.
latest_status = printer.get_status()

# Display the values captured before and after the change.
print("Earlier:", earlier_status)
print("Latest:", latest_status)
# Read the category stored on the printer instance.
print("Category:", printer.category)
print(keyboard.name, keyboard.category, keyboard.status)
