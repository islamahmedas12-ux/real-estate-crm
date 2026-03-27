import 'package:flutter_test/flutter_test.dart';
import 'package:real_estate_crm/main.dart';

void main() {
  testWidgets('App renders homepage', (WidgetTester tester) async {
    await tester.pumpWidget(const RealEstateCrmApp());
    expect(find.text('Real Estate CRM'), findsWidgets);
    expect(find.text('Welcome to Real Estate CRM'), findsOneWidget);
  });
}
