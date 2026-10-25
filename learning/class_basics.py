class Asset:
    def __init__(self, name, status="available"):
        # Store the starting information on each new instance.
        self.name = name
        self.status = status

    def change_status(self, new_status):
        # Update the instance receiving this method call.
        self.status = new_status

    def get_status(self):
        # Give the caller this instance's current status.
        return self.status


# BEFORE: create one instance and read its starting status.
printer = Asset("Demo printer", "assigned")
earlier_status = printer.get_status()

# CHANGE: update the existing printer instance.
printer.change_status("assigned")

# AFTER: read its status again.
latest_status = printer.get_status()

# Display the values captured before and after the change.
print("Earlier:", earlier_status)
print("Latest:", latest_status)
