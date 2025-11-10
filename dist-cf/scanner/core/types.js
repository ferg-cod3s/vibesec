export var Severity;
(function (Severity) {
    Severity["CRITICAL"] = "critical";
    Severity["HIGH"] = "high";
    Severity["MEDIUM"] = "medium";
    Severity["LOW"] = "low";
})(Severity || (Severity = {}));
export var Category;
(function (Category) {
    Category["SECRETS"] = "secrets";
    Category["INJECTION"] = "injection";
    Category["AUTH"] = "auth";
    Category["INCOMPLETE"] = "incomplete";
    Category["AI_SPECIFIC"] = "ai-specific";
    Category["DEPENDENCIES"] = "dependencies";
    Category["WEB_SECURITY"] = "web-security";
    Category["CRYPTOGRAPHY"] = "cryptography";
    Category["CUSTOM"] = "custom";
})(Category || (Category = {}));
