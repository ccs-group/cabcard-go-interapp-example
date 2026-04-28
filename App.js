import { StyleSheet, Text, View, Button, TextInput, ScrollView } from "react-native";
import { useState } from "react";
import { startActivityAsync } from "expo-intent-launcher";
import { randomUUID } from "expo-crypto";
import { Picker } from "@react-native-picker/picker";

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [intentResult, setIntentResult] = useState(null);
  const [intentCancelled, setIntentCancelled] = useState(false);
  const [intentCompleted, setIntentCompleted] = useState(false);
  const [originator, setOriginator] = useState("Custom App");
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amountText, setAmountText] = useState("");
  const amount = parseFloat(amountText) || 0;

  const originators = ["Custom App", "Cab9", "Autocab", "iCabbi", "CabTreasure", "Cordic"];

  const presets = [
    { label: "Custom", originator: "Custom App", amount: 0, reference: "" },
    {
      label: "Invalid payload",
      reference:
        "Because this reference exceeds the allowed length of 100 characters, it will not be accepted as valid.",
    },
  ];

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
    setReference("");
    setAmountText("");
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!isStarted ? (
          <View style={styles.card}>
            <Text style={styles.title}>CabCard Payment Demo</Text>

            <Text style={styles.label}>Preset</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                mode="dropdown"
                onValueChange={(value) => {
                  const preset = presets.find((p) => p.label === value);
                  if (!preset) return;
                  if ("amount" in preset) setAmountText(preset.amount === 0 ? "" : String(preset.amount));
                  if ("originator" in preset) setOriginator(preset.originator);
                  if ("reference" in preset) setReference(preset.reference);
                }}
              >
                {presets.map((p) => (
                  <Picker.Item key={p.label} label={p.label} value={p.label} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>App name</Text>
            <View style={styles.pickerWrapper}>
              <Picker mode="dropdown" selectedValue={originator} onValueChange={setOriginator}>
                {originators.map((o) => (
                  <Picker.Item key={o} label={o} value={o} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Reference</Text>
            <TextInput
              style={styles.input}
              onChangeText={setReference}
              value={reference}
              placeholder="e.g. booking ID"
            />

            <Text style={styles.label}>Amount</Text>
            <View style={styles.prefixInputWrapper}>
              <Text style={styles.prefix}>£</Text>
              <TextInput
                style={styles.prefixInput}
                keyboardType="decimal-pad"
                autoFocus={true}
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
                color="#cc0000"
                disabled={amount < 1}
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    backgroundColor: "#fafafa",
    overflow: "hidden",
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
