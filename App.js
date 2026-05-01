import { StyleSheet, Text, View, Button, TextInput, ScrollView } from "react-native";
import { useState, useRef } from "react";
import { startActivityAsync } from "expo-intent-launcher";
import { randomUUID } from "expo-crypto";
import SelectDropdown from "react-native-select-dropdown";

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [intentResult, setIntentResult] = useState(null);
  const [intentCancelled, setIntentCancelled] = useState(false);
  const [intentCompleted, setIntentCompleted] = useState(false);
  const originators = ["Custom App", "Cab9", "Autocab", "iCabbi", "CabTreasure", "Cordic"];

  const presets = [
    { label: "Valid (£10)", originator: "Custom App", amount: 10, reference: "BOOKING-001" },
    { label: "Custom", originator: "Custom App", amount: 0, reference: "" },
    {
      label: "Invalid payload",
      reference:
        "Because this reference exceeds the allowed length of 100 characters, it will not be accepted as valid.",
    },
  ];

  const presetRef = useRef(null);
  const originatorRef = useRef(null);
  const [originator, setOriginator] = useState(presets[0].originator);
  const [reference, setReference] = useState(presets[0].reference);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amountText, setAmountText] = useState(String(presets[0].amount));
  const amount = parseFloat(amountText) || 0;

  const PACKAGE_NAME = "services.cabcard.driver";

  async function handleStart() {
    setIsStarted(true);

    const params = {
      amount: parseInt(Math.round(amount * 100), 10),
      currency: "GBP",
      originator,
      reference,
      customerEmailAddress: email,
      customerPhoneNumber: phone,
      identifier: randomUUID(),
    };

    const intentParams = {
      packageName: PACKAGE_NAME,
      className: `${PACKAGE_NAME}.MainActivity`,
      extra: {
        action: "transaction",
        transaction: JSON.stringify(params),
      },
    };

    try {
      const intentResult = await startActivityAsync("ACTION_MAIN", intentParams);
      console.log("intent result: ", intentResult);
      setIntentResult(intentResult);
      if (intentResult.resultCode === 0) setIntentCancelled(true);
      if (intentResult.resultCode === -1) setIntentCompleted(true);
    } catch (error) {
      console.error("Intent error (message): ", error.message);
      console.error("Intent error (err): ", error);
    }
  }

  function handleReset() {
    setIsStarted(false);
    setIntentResult(null);
    setIntentCancelled(false);
    setIntentCompleted(false);
    setOriginator(presets[0].originator);
    setReference(presets[0].reference);
    setAmountText(String(presets[0].amount));
    presetRef.current?.reset();
    originatorRef.current?.reset();
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!isStarted ? (
          <View style={styles.card}>
            <Text style={styles.title}>CabCard Payment Demo</Text>

            <Text style={styles.label}>Preset</Text>
            <SelectDropdown
              ref={presetRef}
              data={presets}
              defaultValue={presets[0]}
              onSelect={(item) => {
                if ("amount" in item) setAmountText(item.amount === 0 ? "" : String(item.amount));
                if ("originator" in item) setOriginator(item.originator);
                if ("reference" in item) setReference(item.reference);
              }}
              renderButton={(selected) => (
                <View style={styles.dropdownButton}>
                  <Text style={styles.dropdownButtonText}>{selected ? selected.label : presets[0].label}</Text>
                  <Text style={styles.dropdownChevron}>›</Text>
                </View>
              )}
              renderItem={(item, _, isSelected) => (
                <View style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}>
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>{item.label}</Text>
                </View>
              )}
              dropdownStyle={styles.dropdownSheet}
            />

            <Text style={styles.label}>App name</Text>
            <SelectDropdown
              ref={originatorRef}
              data={originators}
              defaultValue={originators[0]}
              onSelect={setOriginator}
              renderButton={(selected) => (
                <View style={styles.dropdownButton}>
                  <Text style={styles.dropdownButtonText}>{selected || originators[0]}</Text>
                  <Text style={styles.dropdownChevron}>›</Text>
                </View>
              )}
              renderItem={(item, _, isSelected) => (
                <View style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}>
                  <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>{item}</Text>
                </View>
              )}
              dropdownStyle={styles.dropdownSheet}
            />

            <Text style={styles.label}>Reference</Text>
            <TextInput
              style={styles.input}
              onChangeText={setReference}
              value={reference}
              placeholder="e.g. booking ID"
            />

            <Text style={styles.label}>Amount <Text style={styles.required}>*</Text></Text>
            <View style={styles.prefixInputWrapper}>
              <Text style={styles.prefix}>£</Text>
              <TextInput
                style={styles.prefixInput}
                keyboardType="decimal-pad"
                value={amountText}
                onChangeText={setAmountText}
                placeholder="0.00"
              />
            </View>

            <Text style={styles.label}>
              Customer email <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              placeholder="customer@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>
              Customer phone <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              onChangeText={setPhone}
              value={phone}
              placeholder="+44..."
              keyboardType="phone-pad"
            />

            <View style={styles.buttonRow}>
              <Button
                onPress={handleStart}
                title="Open CabCard"
                color="#2e7d32"
                disabled={amount <= 0}
              />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>Result</Text>
            {intentCancelled && <Text style={styles.statusText}>Action was CANCELLED</Text>}
            {intentCompleted && (
              <Text style={[styles.statusText, styles.success]}>Action was COMPLETED</Text>
            )}
            {intentResult?.extra?.transactionAttempt && (
              <>
                <Text style={styles.label}>Transaction attempt:</Text>
                <Text style={styles.code}>
                  {JSON.stringify(intentResult.extra.transactionAttempt, null, 2)}
                </Text>
              </>
            )}
            {intentResult?.extra?.error && (
              <Text style={styles.errorText}>Error: {intentResult.extra.message}</Text>
            )}
            <Button onPress={handleReset} title="Reset" color="#0055cc" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8f0fe",
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#1a1a2e",
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
    marginBottom: 4,
    marginTop: 12,
  },
  optional: {
    fontWeight: "400",
    color: "#999",
  },
  required: {
    color: "#cc0000",
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
    width: "100%",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  dropdownChevron: {
    fontSize: 22,
    color: "#888",
    transform: [{ rotate: "90deg" }],
  },
  dropdownSheet: {
    borderRadius: 8,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemActive: {
    backgroundColor: "#e8f4e8",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  dropdownItemTextActive: {
    fontWeight: "600",
    color: "#2e7d32",
  },
  prefixInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },
  prefix: {
    fontSize: 16,
    color: "#555",
    marginRight: 2,
  },
  prefixInput: {
    flex: 1,
    fontSize: 16,
    color: "#1a1a1a",
    height: "100%",
  },
  buttonRow: {
    marginTop: 24,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 12,
    color: "#555",
  },
  success: {
    color: "#1a7a1a",
    fontWeight: "600",
  },
  errorText: {
    color: "#cc0000",
    marginBottom: 12,
  },
  code: {
    fontFamily: "monospace",
    fontSize: 12,
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    color: "#333",
  },
});
